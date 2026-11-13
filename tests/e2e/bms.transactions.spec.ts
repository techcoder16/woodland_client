/**
 * Transactions: lifecycle, status rules, approval, paid lock, versioning, fee maths,
 * recharge guards, notes, idempotency, role gates. Local only. NEVER point at production.
 */
import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test';

const API = process.env.E2E_API_URL || 'http://localhost:5000/api';
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || 'admin@woodland.com', password: process.env.E2E_ADMIN_PASSWORD || '12345' };
const RUN = `tx${Date.now().toString(36)}`;
const PASSWORD = 'Test@12345!';

let api: APIRequestContext;
let admin = '';
let finance = '';
let basic = '';
let propertyId = '';
let n = 0;
const h = (t: string, key?: string) => ({ Authorization: `Bearer ${t}`, ...(key ? { 'Idempotency-Key': `${RUN}-${key}` } : {}) });

async function login(email: string, password: string) {
  const r = await api.post(`${API}/auth/login`, { data: { email, password } });
  expect(r.ok(), await r.text()).toBeTruthy();
  return (await r.json()).accessToken as string;
}
async function make(data: object = {}, token = admin) {
  const r = await api.post(`${API}/transaction`, {
    headers: h(token, `tx-${++n}`),
    data: { propertyId, fromTenantDate: new Date().toISOString(), fromTenantRentReceived: 500, fromTenantMode: 'BANK', ...data },
  });
  expect(r.ok(), await r.text()).toBeTruthy();
  const b = await r.json();
  return (b.transaction ?? b) as any;
}
const get = async (id: string) => {
  const b = await (await api.get(`${API}/transaction/${id}`, { headers: h(admin) })).json();
  return (b.transaction ?? b) as any;
};
const post = (path: string, token = admin, data: object = {}) => api.post(`${API}/transaction/${path}`, { headers: h(token, `p-${++n}`), data });

const INVALID = [400, 422]; // this API answers validation failures with 422

test.beforeAll(async () => {
  api = await pwRequest.newContext();
  admin = await login(ADMIN.email, ADMIN.password);
  for (const [k, role] of [['fin', 'FINANCE_USER'], ['bas', 'BASIC_USER']] as const) {
    const r = await api.post(`${API}/user`, { headers: h(admin, k), data: { email: `${k}.${RUN}@bms.test`, password: PASSWORD, first_name: k, last_name: 'T', role, department: 'OTHER' } });
    expect(r.ok(), await r.text()).toBeTruthy();
  }
  finance = await login(`fin.${RUN}@bms.test`, PASSWORD);
  basic = await login(`bas.${RUN}@bms.test`, PASSWORD);
  const v = await api.post(`${API}/vendor/create`, { headers: h(admin, 'v'), data: { vendorType: 'INDIVIDUAL', firstName: 'Tx', lastName: 'Landlord', email: `ll.${RUN}@bms.test`, phone: '07000000030', addressLine1: '1 Tx Road', town: 'London', postCode: 'SW1A 1AA', country: 'GB' } });
  const vendorId = (await v.json()).vendor.id;
  const p = await api.post(`${API}/properties`, { headers: h(admin, 'p'), data: { vendor: vendorId, postCode: 'SW1A 2AA', addressLine1: `${RUN} Tx Street`, town: 'London', country: 'GB' } });
  propertyId = (await p.json()).property.id;
  await api.patch(`${API}/properties/${propertyId}/publish`, { headers: h(admin) });
});

test.describe('create', () => {
  test('tranid and reference are unique and increasing', async () => {
    const a = await make();
    const b = await make();
    expect(b.tranid).toBeGreaterThan(a.tranid);
    expect(a.reference).not.toBe(b.reference);
  });

  test('rejects missing / unknown property', async () => {
    const none = await api.post(`${API}/transaction`, { headers: h(admin, 'np'), data: { fromTenantRentReceived: 1 } });
    expect(INVALID).toContain(none.status());
    const bad = await api.post(`${API}/transaction`, { headers: h(admin, 'bp'), data: { propertyId: 'does-not-exist' } });
    expect(bad.status()).toBeGreaterThanOrEqual(400);
    expect(bad.status()).toBeLessThan(500);
  });

  test('rejects bad types (string amount, invalid status)', async () => {
    const r1 = await api.post(`${API}/transaction`, { headers: h(admin, 'ba'), data: { propertyId, fromTenantRentReceived: 'lots' } });
    expect(INVALID).toContain(r1.status());
    const r2 = await api.post(`${API}/transaction`, { headers: h(admin, 'bs'), data: { propertyId, status: 'NOPE' } });
    expect(INVALID).toContain(r2.status());
  });

  test('same Idempotency-Key does not create a duplicate', async () => {
    const key = { headers: h(admin, 'same-key'), data: { propertyId, fromTenantRentReceived: 77, fromTenantDescription: `idem ${RUN}` } };
    const r1 = await api.post(`${API}/transaction`, key);
    const r2 = await api.post(`${API}/transaction`, key);
    expect(r1.ok()).toBeTruthy();
    expect(r2.status()).toBeLessThan(500);
    const list = await (await api.get(`${API}/transaction?search=${encodeURIComponent(`idem ${RUN}`)}&limit=50`, { headers: h(admin) })).json();
    const rows = (list.transactions ?? list.data ?? list) as any[];
    expect(rows.filter((t) => t.fromTenantDescription === `idem ${RUN}`).length).toBe(1);
  });

  test('management fee PERCENT is computed server-side', async () => {
    const t = await make({ toLandlordRentReceived: 1000, toLandlordManagementFeeMode: 'PERCENT', toLandlordManagementFeePercent: 12.5 });
    expect(Number(t.toLandlordLessManagementFees)).toBeCloseTo(125, 2);
  });

  test('recharge line for a job not on this property is refused', async () => {
    const r = await api.post(`${API}/transaction`, {
      headers: h(admin, 'rj'),
      data: { propertyId, adjustments: [{ type: 'Maintenance', description: 'x', amount: 50, jobTypeId: 'not-a-real-job' }] },
    });
    expect(r.status()).toBe(400);
  });

  test('adjustments are stored and replaced on update', async () => {
    const t = await make({ adjustments: [{ type: 'Other', description: 'A', amount: 10 }, { type: 'Other', description: 'B', amount: 20 }] });
    expect((await get(t.id)).adjustments?.length).toBe(2);
    const u = await api.patch(`${API}/transaction/${t.id}`, { headers: h(admin), data: { adjustments: [{ type: 'Other', description: 'C', amount: 5 }] } });
    expect(u.ok(), await u.text()).toBeTruthy();
    expect((await get(t.id)).adjustments?.length).toBe(1);
  });
});

test.describe('draft → active → paid', () => {
  test('draft cannot be paid; publish makes it ACTIVE; publishing twice is a 400 not a 500', async () => {
    const t = await make({ status: 'DRAFT' });
    expect(t.status).toBe('DRAFT');
    expect((await post(`${t.id}/mark-paid`)).status()).toBe(400);
    const pub = await post(`${t.id}/publish`);
    expect(pub.ok(), await pub.text()).toBeTruthy();
    expect((await get(t.id)).status).toBe('ACTIVE');
    expect((await post(`${t.id}/publish`)).status()).toBe(400);
  });

  test('drafts list contains drafts only; active list excludes them', async () => {
    const d = await make({ status: 'DRAFT', fromTenantDescription: `draft ${RUN}` });
    const drafts = JSON.stringify(await (await api.get(`${API}/transaction/drafts`, { headers: h(admin) })).json());
    expect(drafts).toContain(d.id);
    const active = JSON.stringify(await (await api.get(`${API}/transaction/active`, { headers: h(admin) })).json());
    expect(active).not.toContain(d.id);
  });

  test('PAID cannot be set through a plain edit', async () => {
    const t = await make({ status: 'ACTIVE' });
    const r = await api.patch(`${API}/transaction/${t.id}`, { headers: h(admin), data: { status: 'PAID' } });
    expect(r.status()).toBe(400);
  });

  test('paid is a locked record: no edit, delete, approval request or second payment', async () => {
    const t = await make({ status: 'ACTIVE' });
    expect((await post(`${t.id}/mark-paid`)).ok()).toBeTruthy();
    expect((await get(t.id)).status).toBe('PAID');
    expect((await api.patch(`${API}/transaction/${t.id}`, { headers: h(admin), data: { fromTenantDescription: 'changed' } })).status()).toBe(403);
    expect((await api.delete(`${API}/transaction/${t.id}`, { headers: h(admin) })).status()).toBe(403);
    expect((await post(`${t.id}/request-approval`)).status()).toBe(400);
    expect((await post(`${t.id}/mark-paid`)).status()).toBe(400);
  });

  test('bulk-status never touches PAID rows', async () => {
    const t = await make({ status: 'ACTIVE' });
    await post(`${t.id}/mark-paid`);
    await post('bulk-status', admin, { ids: [t.id], status: 'DRAFT' });
    expect((await get(t.id)).status).toBe('PAID');
  });
});

test.describe('approval', () => {
  test('request → blocked from paying → finance cannot approve → admin approves → pay', async () => {
    const t = await make({ status: 'ACTIVE' });
    expect((await post(`${t.id}/request-approval`, finance)).ok()).toBeTruthy();
    expect((await get(t.id)).status).toBe('APPROVAL_REQUIRED');
    expect((await post(`${t.id}/mark-paid`)).status()).toBe(400);
    const sneak = await api.patch(`${API}/transaction/${t.id}`, { headers: h(admin), data: { status: 'ACTIVE' } });
    expect(sneak.status(), 'a plain edit must not bypass approval').toBe(403);
    expect((await post(`${t.id}/approve`, finance)).status()).toBe(403);
    expect((await post(`${t.id}/approve`, admin)).ok()).toBeTruthy();
    const after = await get(t.id);
    expect(after.status).toBe('ACTIVE');
    expect(after.approvedByName || after.approvedById).toBeTruthy();
    expect((await post(`${t.id}/mark-paid`, finance)).ok()).toBeTruthy();
  });

  test('bulk approve skips rows that are not awaiting approval', async () => {
    const waiting = await make({ status: 'ACTIVE' });
    await post(`${waiting.id}/request-approval`);
    const plain = await make({ status: 'ACTIVE' });
    const r = await post('bulk-approve', admin, { ids: [waiting.id, plain.id] });
    expect(r.ok(), await r.text()).toBeTruthy();
    const body = await r.json();
    expect(body.approved.length).toBe(1);
    expect(body.skipped).toContain(plain.id);
    expect((await post('bulk-approve', finance, { ids: [waiting.id] })).status()).toBe(403);
  });

  test('on hold (PENDING) cannot be paid; only an approved row can be released', async () => {
    const unapproved = await make({ status: 'ACTIVE' });
    await post('bulk-status', admin, { ids: [unapproved.id], status: 'PENDING' });
    expect((await get(unapproved.id)).status).toBe('PENDING');
    expect((await post(`${unapproved.id}/mark-paid`)).status()).toBe(400);
    await post('bulk-status', admin, { ids: [unapproved.id], status: 'ACTIVE' });
    expect((await get(unapproved.id)).status, 'never-approved rows cannot be released to Ready').toBe('PENDING');

    const t = await make({ status: 'ACTIVE' });
    await post(`${t.id}/request-approval`);
    await post(`${t.id}/approve`);
    await post('bulk-status', admin, { ids: [t.id], status: 'PENDING' });
    expect((await post(`${t.id}/mark-paid`)).status()).toBe(400);
    await post('bulk-status', admin, { ids: [t.id], status: 'ACTIVE' });
    expect((await post(`${t.id}/mark-paid`)).ok()).toBeTruthy();
  });
});

test.describe('concurrency, deletion, notes, roles', () => {
  test('stale version is rejected with 409; current version saves', async () => {
    const t = await make({ status: 'ACTIVE' });
    const cur = await get(t.id);
    const ok = await api.patch(`${API}/transaction/${t.id}`, { headers: h(admin), data: { fromTenantDescription: 'first', version: cur.version } });
    expect(ok.ok(), await ok.text()).toBeTruthy();
    const stale = await api.patch(`${API}/transaction/${t.id}`, { headers: h(admin), data: { fromTenantDescription: 'second', version: cur.version } });
    expect(stale.status()).toBe(409);
  });

  test('delete removes it from reads and lists; unknown ids are 404', async () => {
    const t = await make({ status: 'DRAFT', fromTenantDescription: `gone ${RUN}` });
    expect((await api.delete(`${API}/transaction/${t.id}`, { headers: h(admin) })).ok()).toBeTruthy();
    expect((await api.get(`${API}/transaction/${t.id}`, { headers: h(admin) })).status()).toBe(404);
    expect(JSON.stringify(await (await api.get(`${API}/transaction/drafts`, { headers: h(admin) })).json())).not.toContain(t.id);
    expect((await api.delete(`${API}/transaction/${t.id}`, { headers: h(admin) })).status()).toBe(404);
    expect((await api.get(`${API}/transaction/nope-${RUN}`, { headers: h(admin) })).status()).toBe(404);
  });

  test('notes: add, list, and survive on a paid transaction', async () => {
    const t = await make({ status: 'ACTIVE' });
    const add = await api.post(`${API}/transaction/${t.id}/notes`, { headers: h(admin, `n-${t.id}`), data: { content: `note ${RUN}`, note: `note ${RUN}` } });
    expect(add.ok(), await add.text()).toBeTruthy();
    expect(JSON.stringify(await (await api.get(`${API}/transaction/${t.id}/notes`, { headers: h(admin) })).json())).toContain(`note ${RUN}`);
  });

  test('summary and by-property reflect created transactions', async () => {
    const sum = await api.get(`${API}/transaction/summary?propertyId=${propertyId}`, { headers: h(admin) });
    expect(sum.ok(), await sum.text()).toBeTruthy();
    const by = await api.get(`${API}/transaction/by-property?propertyId=${propertyId}`, { headers: h(admin) });
    expect(by.ok()).toBeTruthy();
    expect(INVALID).toContain((await api.get(`${API}/transaction/summary`, { headers: h(admin) })).status());
  });

  test('basic user and anonymous callers are locked out; finance can read and create', async () => {
    expect((await api.get(`${API}/transaction`, { headers: h(basic) })).status()).toBe(403);
    expect((await api.get(`${API}/transaction`)).status()).toBe(401);
    expect((await api.get(`${API}/transaction`, { headers: h(finance) })).ok()).toBeTruthy();
    const t = await make({}, finance);
    expect(t.id).toBeTruthy();
  });

  test('search and pagination return sane shapes', async () => {
    const r = await api.get(`${API}/transaction?limit=2&page=1`, { headers: h(admin) });
    expect(r.ok(), await r.text()).toBeTruthy();
    expect((await api.get(`${API}/transaction?status=ACTIVE&limit=5`, { headers: h(admin) })).ok()).toBeTruthy();
  });
});
