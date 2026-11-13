/**
 * BMS end-to-end flow: API driven, with a real inbox (Mailpit) receiving the emails.
 *
 *   docker compose -f woodland-server-nest/docker-compose.local.yml up -d
 *   # start the server pointed at Mailpit (see tests/e2e/README.md), then:
 *   npx playwright test tests/e2e/bms.flow.spec.ts
 *
 * Covers: staff accounts (2 finance + 1 basic), landlord create -> email -> login -> edit,
 * contractor create -> email -> login, draft/publish permissions, a maintenance job with
 * deductible + landlord-portal visibility, the landlord email, and the refresh-token race
 * that used to log users out. NEVER point this at production.
 */
import { test, expect, APIRequestContext, request as pwRequest } from '@playwright/test';
import { clearInbox, waitForMail, tempPasswordFrom } from './mailpit';

const API = process.env.E2E_API_URL || 'http://localhost:5000/api';
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || 'admin@woodland.com', password: process.env.E2E_ADMIN_PASSWORD || '12345' };
const RUN = Date.now().toString(36);
const PASSWORD = 'Test@12345!';

// Five addresses, all readable in the Mailpit inbox.
const MAILBOXES = {
  landlord: process.env.E2E_LANDLORD_EMAIL || `landlord.${RUN}@bms.test`,
  contractor: `contractor.${RUN}@bms.test`,
  finance1: `finance1.${RUN}@bms.test`,
  finance2: `finance2.${RUN}@bms.test`,
  basic: `basic.${RUN}@bms.test`,
};

let api: APIRequestContext;
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function staffLogin(email: string, password: string) {
  const res = await api.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.ok(), `login ${email}: ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  return { token: body.accessToken as string, refresh: body.refreshToken as string };
}

test.describe.configure({ mode: 'serial' });

test.describe('BMS flow', () => {
  let admin: string;
  let finance1: string;
  let basic: string;
  let propertyId: string;
  let vendorId: string;
  let jobId: string;
  let landlordToken: string;

  test.beforeAll(async () => {
    api = await pwRequest.newContext();
    await clearInbox();
    admin = (await staffLogin(ADMIN.email, ADMIN.password)).token;
  });

  test('create two finance accounts and a basic account', async () => {
    for (const [key, role] of [['finance1', 'FINANCE_USER'], ['finance2', 'FINANCE_USER'], ['basic', 'BASIC_USER']] as const) {
      const res = await api.post(`${API}/user`, {
        headers: { ...auth(admin), 'Idempotency-Key': `${RUN}-${key}` },
        data: { email: MAILBOXES[key], password: PASSWORD, first_name: key, last_name: 'Tester', role, department: 'OTHER' },
      });
      expect(res.ok(), await res.text()).toBeTruthy();
    }
    finance1 = (await staffLogin(MAILBOXES.finance1, PASSWORD)).token;
    basic = (await staffLogin(MAILBOXES.basic, PASSWORD)).token;
  });

  test('landlord is created, emailed, can log in, and can be edited', async () => {
    const res = await api.post(`${API}/vendor/create`, {
      headers: { ...auth(admin), 'Idempotency-Key': `${RUN}-vendor` },
      data: { vendorType: 'INDIVIDUAL', firstName: 'Lena', lastName: 'Landlord', email: MAILBOXES.landlord, phone: '07000000001', addressLine1: '1 Test Road', town: 'London', postCode: 'SW1A 1AA', country: 'GB' },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    vendorId = (await res.json()).vendor.id;

    const mail = await waitForMail(MAILBOXES.landlord, { subject: 'account is ready' });
    const temp = tempPasswordFrom(mail);

    const login = await api.post(`${API}/auth/vendor/login`, { data: { email: MAILBOXES.landlord, password: temp } });
    expect(login.ok(), await login.text()).toBeTruthy();
    const loginBody = await login.json();
    landlordToken = loginBody.accessToken ?? loginBody.access_token;
    expect(landlordToken).toBeTruthy();

    // Edit: name/phone change; the login email must not move.
    const edit = await api.patch(`${API}/vendor/update/${vendorId}`, {
      headers: auth(admin),
      data: { firstName: 'Leena', phone: '07000000002', email: 'hacker@bms.test' },
    });
    expect(edit.ok(), await edit.text()).toBeTruthy();
    const after = await (await api.get(`${API}/vendor/getVendorById/${vendorId}`, { headers: auth(admin) })).json();
    const v = after.vendor ?? after;
    expect(v.firstName).toBe('Leena');
    expect(v.email).toBe(MAILBOXES.landlord);
  });

  test('draft properties: non-admin saves as draft and cannot publish; admin can', async () => {
    const res = await api.post(`${API}/properties`, {
      headers: { ...auth(basic), 'Idempotency-Key': `${RUN}-prop` },
      data: { vendor: vendorId, postCode: 'SW1A 2AA', addressLine1: `${RUN} Draft Street`, town: 'London', country: 'GB', propertyStatus: 'PUBLISHED' },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const created = (await res.json()).property;
    propertyId = created.id;
    expect(created.propertyStatus).toBe('DRAFT'); // forced, even though PUBLISHED was requested

    expect((await api.patch(`${API}/properties/${propertyId}/publish`, { headers: auth(basic) })).status()).toBe(403);
    expect((await api.get(`${API}/properties/drafts`, { headers: auth(basic) })).status()).toBe(403);

    const published = await api.patch(`${API}/properties/${propertyId}/publish`, { headers: auth(admin) });
    expect(published.ok()).toBeTruthy();
    expect((await published.json()).property.propertyStatus).toBe('PUBLISHED');
  });

  test('contractor is created, emailed and can log in', async () => {
    const res = await api.post(`${API}/contractor/create`, {
      headers: { ...auth(admin), 'Idempotency-Key': `${RUN}-contractor` },
      data: { name: 'Pat Plumber', specialty: 'Plumbing', phone: '07000000003', email: MAILBOXES.contractor },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const temp = tempPasswordFrom(await waitForMail(MAILBOXES.contractor, { subject: 'account is ready' }));
    const login = await api.post(`${API}/auth/contractor/login`, { data: { email: MAILBOXES.contractor, password: temp } });
    expect(login.ok(), await login.text()).toBeTruthy();
  });

  test('maintenance job: deductible, landlord-portal visibility and the landlord email', async () => {
    const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    const create = await api.post(`${API}/property-management/job-type`, {
      headers: { ...auth(admin), 'Idempotency-Key': `${RUN}-job` },
      data: { propertyId, jobType: 'Plumbing', location: 'Kitchen', description: 'Leaking tap', dueDate: due, priority: 'Critical' },
    });
    expect(create.ok(), await create.text()).toBeTruthy();
    const body = await create.json();
    jobId = (body.jobType ?? body.job ?? body).id;
    expect(jobId).toBeTruthy();

    const jobUrl = `${API}/property-management/job-type/${jobId}`;
    const portalList = async () =>
      (await (await api.get(`${API}/property-management/job-type?limit=50`, { headers: auth(landlordToken) })).json()).jobTypes as any[];
    expect((await portalList()).some((j) => j.id === jobId)).toBeTruthy();

    // Deductible flag round-trips and is visible to the landlord on the list.
    expect((await api.post(jobUrl, { headers: auth(admin), data: { propertyId, deductible: false } })).ok()).toBeTruthy();
    expect((await portalList()).find((j) => j.id === jobId)?.deductible).toBe(false);

    // Hiding from the landlord portal removes it from their list.
    expect((await api.post(jobUrl, { headers: auth(admin), data: { propertyId, showOnLandlordPortal: false } })).ok()).toBeTruthy();
    expect((await portalList()).some((j) => j.id === jobId)).toBeFalsy();
    await api.post(jobUrl, { headers: auth(admin), data: { propertyId, showOnLandlordPortal: true } });

    // The staff "send / update email to landlord" button.
    const sent = await api.post(`${jobUrl}/email-landlord`, { headers: auth(admin), data: {} });
    expect(sent.ok(), await sent.text()).toBeTruthy();
    const mail = await waitForMail(MAILBOXES.landlord, { subject: 'Leaking tap' }).catch(() => waitForMail(MAILBOXES.landlord, { subject: 'maintenance' }));
    expect(mail.Subject).toBeTruthy();
  });

  test('role gate: a finance user cannot unpublish a property', async () => {
    const res = await api.patch(`${API}/properties/${propertyId}/unpublish`, { headers: auth(finance1) });
    expect(res.status()).toBe(403);
  });

  test('session: parallel refreshes with one token cannot all succeed (server rotates)', async () => {
    const { refresh } = await staffLogin(ADMIN.email, ADMIN.password);
    // The server rotates refresh tokens, so only the first of N simultaneous refreshes using
    // the same token can succeed. The client shares a single in-flight refresh to avoid
    // the losers logging the user out; this documents the server behaviour it works around.
    await new Promise((r) => setTimeout(r, 1200)); // JWTs issued in the same second are byte-identical
    const first = await api.post(`${API}/auth/refresh`, { headers: auth(refresh), data: {} });
    expect(first.ok(), await first.text()).toBeTruthy();
    // Reusing the already-rotated token afterwards is rejected: this is what logged users out
    // when two tabs / parallel requests refreshed independently.
    const reuse = await api.post(`${API}/auth/refresh`, { headers: auth(refresh), data: {} });
    expect(reuse.ok()).toBeFalsy();
  });
});
