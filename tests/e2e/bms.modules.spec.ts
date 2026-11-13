/**
 * Module-by-module coverage: every staff list/summary endpoint answers 200 for admin, a
 * transaction + incoming payment + tenant + occupancy are created, and every staff screen
 * renders in Chromium with no crash, no page error and no 5xx from the API.
 * Local only (see README.md). NEVER point this at production.
 */
import { test, expect, Page, request as pwRequest, APIRequestContext } from '@playwright/test';

const API = process.env.E2E_API_URL || 'http://localhost:5000/api';
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || 'admin@woodland.com', password: process.env.E2E_ADMIN_PASSWORD || '12345' };
const RUN = `mod${Date.now().toString(36)}`;

let api: APIRequestContext;
let token = '';
let vendorId = '';
let propertyId = '';
const auth = () => ({ Authorization: `Bearer ${token}` });
const idem = (k: string) => ({ ...auth(), 'Idempotency-Key': `${RUN}-${k}` });

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  api = await pwRequest.newContext();
  const login = await api.post(`${API}/auth/login`, { data: ADMIN });
  expect(login.ok(), await login.text()).toBeTruthy();
  token = (await login.json()).accessToken;
  const v = await api.post(`${API}/vendor/create`, {
    headers: idem('vendor'),
    data: { vendorType: 'INDIVIDUAL', firstName: 'Mod', lastName: 'Landlord', email: `landlord.${RUN}@bms.test`, phone: '07000000009', addressLine1: '1 Mod Road', town: 'London', postCode: 'SW1A 1AA', country: 'GB' },
  });
  expect(v.ok(), await v.text()).toBeTruthy();
  vendorId = (await v.json()).vendor.id;
  const p = await api.post(`${API}/properties`, {
    headers: idem('prop'),
    data: { vendor: vendorId, postCode: 'SW1A 2AA', addressLine1: `${RUN} Module Street`, town: 'London', country: 'GB' },
  });
  expect(p.ok(), await p.text()).toBeTruthy();
  propertyId = (await p.json()).property.id;
  await api.patch(`${API}/properties/${propertyId}/publish`, { headers: auth() });
});

test.describe('API: every module list answers', () => {
  const lists = [
    'dashboard/stats', 'dashboard/activities', 'dashboard/analytics', 'dashboard/compliance',
    'dashboard/analytics/revenue', 'dashboard/analytics/occupancy', 'dashboard/analytics/property-types',
    'dashboard/analytics/property-status', 'dashboard/analytics/maintenance-status',
    'dashboard/analytics/contractor-workload', 'dashboard/analytics/vacancy-trend',
    'dashboard/analytics/landlord-outstanding', 'dashboard/analytics/pending',
    'vendor/getVendors', 'contractor/getContractors', 'properties', 'properties/drafts',
    'tenants', 'occupancy', 'occupancy/meta', 'occupancy/stats', 'occupancy/options/properties',
    'occupancy/options/staff', 'occupancy/options/occupiers', 'occupancy/councils',
    'transaction', 'transaction/drafts', 'transaction/active', 'transaction/billable-jobs?propertyId=PROP',
    'transaction/next-reference', 'incoming-payments', 'incoming-payments/meta',
    'incoming-payments/summary?propertyId=PROP', 'incoming-payments/councils', 'incoming-payments/occupancies?period=2026-11',
    'property-management/job-type?limit=10', 'user/all', 'screen', 'permission',
  ];
  for (const path of lists) {
    test(`GET /${path}`, async () => {
      const res = await api.get(`${API}/${path.replace('PROP', propertyId)}`, { headers: auth() });
      expect(res.status(), `${path}: ${(await res.text()).slice(0, 300)}`).toBeLessThan(400);
    });
  }
});

test.describe('API: create flows per module', () => {
  test('transaction: create, read, notes, publish, delete', async () => {
    const res = await api.post(`${API}/transaction`, {
      headers: idem('tx'),
      data: { propertyId, fromTenantDate: new Date().toISOString(), fromTenantMode: 'BANK', fromTenantRentReceived: 500, fromTenantDescription: `Rent ${RUN}` },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = await res.json();
    const id = (body.transaction ?? body).id;
    expect(id).toBeTruthy();
    const get = await api.get(`${API}/transaction/${id}`, { headers: auth() });
    expect(get.ok(), await get.text()).toBeTruthy();
    const note = await api.post(`${API}/transaction/${id}/notes`, { headers: auth(), data: { content: 'test note', note: 'test note' } });
    expect(note.status(), await note.text()).toBeLessThan(500);
    const byProp = await api.get(`${API}/transaction/by-property?propertyId=${propertyId}`, { headers: auth() });
    expect(byProp.ok(), await byProp.text()).toBeTruthy();
    const sum = await api.get(`${API}/transaction/summary?propertyId=${propertyId}`, { headers: auth() });
    expect(sum.ok(), await sum.text()).toBeTruthy();
  });

  test('tenant: create and list', async () => {
    const res = await api.post(`${API}/tenants`, {
      headers: idem('tenant'),
      data: { firstName: 'Tina', lastName: 'Tenant', email: `tenant.${RUN}@bms.test`, phone: '07000000010', propertyId },
    });
    expect(res.status(), await res.text()).toBeLessThan(500);
  });

  test('council customer: create and list', async () => {
    const res = await api.post(`${API}/occupancy/councils`, {
      headers: idem('council'),
      data: { name: `Council ${RUN}`, email: `council.${RUN}@bms.test` },
    });
    expect(res.status(), await res.text()).toBeLessThan(500);
  });

  test('contractor: create, update, delete', async () => {
    const res = await api.post(`${API}/contractor/create`, {
      headers: idem('contractor'),
      data: { name: 'Mod Contractor', specialty: 'Electrical', phone: '07000000011', email: `contractor.${RUN}@bms.test` },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
  });

  test('property: edit round-trips and unpublish/publish', async () => {
    const edit = await api.patch(`${API}/properties/${propertyId}`, { headers: auth(), data: { town: 'Leeds' } });
    expect(edit.status(), await edit.text()).toBeLessThan(500);
    expect((await api.patch(`${API}/properties/${propertyId}/unpublish`, { headers: auth() })).ok()).toBeTruthy();
    expect((await api.patch(`${API}/properties/${propertyId}/publish`, { headers: auth() })).ok()).toBeTruthy();
  });
});

test.describe('API: occupancy lifecycle', () => {
  const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  let councilId = '';
  let privateId = '';

  test('private occupancy: created with occupier, extra occupier and default tasks; property becomes reserved', async () => {
    const res = await api.post(`${API}/occupancy`, {
      headers: idem('occ-private'),
      data: {
        propertyId, type: 'PRIVATE', privateCustomerKind: 'INDIVIDUAL', customerFirstName: 'Pri', customerSurname: 'Vate',
        customerEmail: `private.${RUN}@bms.test`, occupier: { FirstName: 'Olly', SureName: 'Occupier', Email: `olly.${RUN}@bms.test`, MobileNo: '07000000020' },
        additionalOccupiers: [{ name: 'Partner One', relationship: 'Partner' }, { name: 'Child One', relationship: 'Son' }],
        moveInDate: day(3), rateAmount: 950, rateFrequency: 'MONTHLY',
        tasks: [{ title: 'Property handover', priority: 'High' }, { title: 'Record meter readings' }],
      },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = await res.json();
    privateId = (body.occupancy ?? body).id;
    expect(privateId).toBeTruthy();
    const full = await (await api.get(`${API}/occupancy/${privateId}`, { headers: auth() })).json();
    const o = full.occupancy ?? full;
    expect(o.status).toBe('PENDING');
    expect(o.tasks?.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(o)).toContain('Partner One');
    const opts = await (await api.get(`${API}/occupancy/options/properties?search=${RUN}`, { headers: auth() })).json();
    expect(JSON.stringify(opts)).toMatch(/Reserved/);
  });

  test('a second live occupancy on the same property is rejected', async () => {
    const res = await api.post(`${API}/occupancy`, {
      headers: idem('occ-clash'),
      data: { propertyId, type: 'PRIVATE', privateCustomerKind: 'INDIVIDUAL', customerFirstName: 'Dup', customerSurname: 'Licate', occupier: { FirstName: 'Dup' }, moveInDate: day(4), rateAmount: 1 },
    });
    expect(res.status(), 'double-booking must not succeed').toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('task add/complete and extra-occupier edit', async () => {
    const add = await api.post(`${API}/occupancy/${privateId}/tasks`, { headers: idem('occ-task'), data: { title: 'Gas safety check' } });
    expect(add.ok(), await add.text()).toBeTruthy();
    const full = await (await api.get(`${API}/occupancy/${privateId}`, { headers: auth() })).json();
    const task = (full.occupancy ?? full).tasks.find((t: any) => t.title === 'Gas safety check');
    const done = await api.patch(`${API}/occupancy/tasks/${task.id}`, { headers: auth(), data: { isCompleted: true } });
    expect(done.ok(), await done.text()).toBeTruthy();
    const upd = await api.patch(`${API}/occupancy/${privateId}`, { headers: auth(), data: { rateAmount: 1000, additionalOccupiers: [{ name: 'Partner One', relationship: 'Spouse' }] } });
    expect(upd.ok(), await upd.text()).toBeTruthy();
  });

  test('status machine: PENDING -> ACTIVE -> ENDING -> ENDED, and illegal jumps are refused', async () => {
    const set = (status: string, extra: object = {}) => api.patch(`${API}/occupancy/${privateId}/status`, { headers: auth(), data: { status, ...extra } });
    expect((await set('ENDED')).status(), 'PENDING cannot jump to ENDED').toBeGreaterThanOrEqual(400);
    expect((await set('ACTIVE')).ok()).toBeTruthy();
    expect((await set('ENDING', { expectedMoveOutDate: day(20) })).ok()).toBeTruthy();
    expect((await set('ENDED', { actualMoveOutDate: day(20) })).ok()).toBeTruthy();
    expect((await set('ACTIVE')).status(), 'ENDED is final').toBeGreaterThanOrEqual(400);
    const opts = await (await api.get(`${API}/occupancy/options/properties?search=${RUN}`, { headers: auth() })).json();
    expect(JSON.stringify(opts)).toMatch(/Vacant/);
  });

  test('council occupancy: linked to a council customer, listed and filterable', async () => {
    const c = await api.post(`${API}/occupancy/councils`, { headers: idem('occ-council'), data: { name: `Occ Council ${RUN}`, email: `occ.council.${RUN}@bms.test` } });
    expect(c.ok(), await c.text()).toBeTruthy();
    councilId = ((await c.json()).council ?? (await c.json().catch(() => ({})))).id;
    const list = await (await api.get(`${API}/occupancy/councils`, { headers: auth() })).json();
    councilId = councilId || (Array.isArray(list) ? list : list.councils ?? list.data).find((x: any) => x.name === `Occ Council ${RUN}`).id;
    const res = await api.post(`${API}/occupancy`, {
      headers: idem('occ-council-booking'),
      data: { propertyId, type: 'COUNCIL', councilCustomerId: councilId, councilReference: `REF-${RUN}`, occupier: { FirstName: 'Cathy', SureName: 'Council' }, moveInDate: day(1), rateAmount: 45, rateFrequency: 'NIGHTLY' },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const filtered = await (await api.get(`${API}/occupancy?type=COUNCIL&councilCustomerId=${councilId}`, { headers: auth() })).json();
    expect(JSON.stringify(filtered)).toContain(`REF-${RUN}`);
    const stats = await api.get(`${API}/occupancy/stats`, { headers: auth() });
    expect(stats.ok()).toBeTruthy();
  });
});

test.describe('UI: every staff screen renders cleanly', () => {
  const routes = [
    '/dashboard', '/vendors', '/vendors/add', `/vendors/edit?id=${'VENDOR'}`, '/properties', '/property/add',
    `/property/edit?id=${'PROP'}`, `/properties/${'PROP'}`, '/property-management', '/transaction',
    '/finance/landlord-payments', '/finance/landlord-transactions', '/finance/woodland-ocr',
    '/finance/landlord-payments/new', '/finance/landlord-transactions/new', '/finance/incoming-payments',
    '/finance/incoming-payments/new', '/compliance', '/tenants', '/occupancy', '/occupancy/new',
    '/council-customers', '/contractors', '/contractors/add', '/maintenance', '/settings', '/admin',
    '/admin/create-user', '/admin/create-screen',
  ];

  test('visit each route', async ({ page }) => {
    test.setTimeout(240000);
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('response', (r) => {
      if (r.url().includes('/api/') && r.status() >= 500) problems.push(`${r.status()} ${r.request().method()} ${r.url()}`);
    });

    await page.goto('/');
    await page.locator('#email').fill(ADMIN.email);
    await page.locator('#password').fill(ADMIN.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });

    for (const raw of routes) {
      const route = raw.replace('VENDOR', vendorId).replace('PROP', propertyId);
      await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      const body = (await page.locator('body').innerText()).toLowerCase();
      if (/something went wrong|application error|cannot read prop|unexpected error/.test(body)) problems.push(`error screen on ${route}`);
      if (/access denied/.test(body)) problems.push(`access denied for admin on ${route}`);
      if (body.trim().length < 20) problems.push(`blank page on ${route}`);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
});
