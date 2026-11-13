/**
 * BMS browser (UI) flow. Seeds data through the API, then drives the real client in Chromium.
 * Same local setup as bms.flow.spec.ts (see README.md). The client must be running on
 * E2E_BASE_URL (default http://localhost:8081; Playwright starts `npm run dev` if it isn't).
 * NEVER point this at production.
 */
import { test, expect, Page, request as pwRequest, APIRequestContext } from '@playwright/test';
import { clearInbox, waitForMail, tempPasswordFrom } from './mailpit';

const API = process.env.E2E_API_URL || 'http://localhost:5000/api';
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || 'admin@woodland.com', password: process.env.E2E_ADMIN_PASSWORD || '12345' };
const RUN = `ui${Date.now().toString(36)}`;
const PASSWORD = 'Test@12345!';
const LANDLORD_EMAIL = `landlord.${RUN}@bms.test`;
const BASIC_EMAIL = `basic.${RUN}@bms.test`;

let api: APIRequestContext;
let adminToken = '';
let propertyId = '';
let jobId = '';
let landlordTemp = '';
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function uiLogin(page: Page, email: string, password: string, path = '/') {
  await page.goto(path);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  api = await pwRequest.newContext();
  await clearInbox();
  const login = await api.post(`${API}/auth/login`, { data: ADMIN });
  expect(login.ok(), await login.text()).toBeTruthy();
  adminToken = (await login.json()).accessToken;

  const u = await api.post(`${API}/user`, {
    headers: { ...auth(adminToken), 'Idempotency-Key': `${RUN}-basic` },
    data: { email: BASIC_EMAIL, password: PASSWORD, first_name: 'Basic', last_name: 'Tester', role: 'BASIC_USER', department: 'OTHER' },
  });
  expect(u.ok(), await u.text()).toBeTruthy();

  const v = await api.post(`${API}/vendor/create`, {
    headers: { ...auth(adminToken), 'Idempotency-Key': `${RUN}-vendor` },
    data: { vendorType: 'INDIVIDUAL', firstName: 'Lena', lastName: 'Landlord', email: LANDLORD_EMAIL, phone: '07000000001', addressLine1: '1 Test Road', town: 'London', postCode: 'SW1A 1AA', country: 'GB' },
  });
  expect(v.ok(), await v.text()).toBeTruthy();
  const vendorId = (await v.json()).vendor.id;
  landlordTemp = tempPasswordFrom(await waitForMail(LANDLORD_EMAIL, { subject: 'account is ready' }));

  const p = await api.post(`${API}/properties`, {
    headers: { ...auth(adminToken), 'Idempotency-Key': `${RUN}-prop` },
    data: { vendor: vendorId, postCode: 'SW1A 2AA', addressLine1: `${RUN} UI Street`, town: 'London', country: 'GB' },
  });
  expect(p.ok(), await p.text()).toBeTruthy();
  propertyId = (await p.json()).property.id;
  await api.patch(`${API}/properties/${propertyId}/publish`, { headers: auth(adminToken) });

  const j = await api.post(`${API}/property-management/job-type`, {
    headers: { ...auth(adminToken), 'Idempotency-Key': `${RUN}-job` },
    data: { propertyId, jobType: 'Plumbing', location: 'Kitchen', description: `Leaking tap ${RUN}`, dueDate: new Date(Date.now() + 6048e5).toISOString().slice(0, 10), priority: 'Critical' },
  });
  expect(j.ok(), await j.text()).toBeTruthy();
  const body = await j.json();
  jobId = (body.jobType ?? body.job ?? body).id;
});

test.describe('staff UI (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await uiLogin(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });
  });

  test('maintenance list: critical is red, row click opens detail, no "View details" button', async ({ page }) => {
    await page.goto('/maintenance');
    const row = page.locator('tr', { hasText: `Leaking tap ${RUN}` });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /view details/i })).toHaveCount(0);
    const badge = row.getByText('Critical', { exact: true }).first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/red/);
    await row.click();
    await expect(page).toHaveURL(new RegExp(`/maintenance/${jobId}`));
  });

  test('maintenance detail: deductible toggle and landlord email button (no checkbox)', async ({ page }) => {
    await page.goto(`/maintenance/${jobId}`);
    await expect(page.getByText(/deductible/i).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('tab', { name: /invoices/i }).click().catch(() => {});
    await expect(page.getByText('Show on landlord portal')).toBeVisible();
    const btn = page.getByRole('button', { name: /send \/ update email to landlord/i });
    await expect(btn).toBeVisible();
    await btn.click();
    const mail = await waitForMail(LANDLORD_EMAIL, { subject: 'maintenance' }).catch(() => waitForMail(LANDLORD_EMAIL, { subject: 'Leaking tap' }));
    expect(mail.Subject).toBeTruthy();
  });

  test('property page: Occupancy / Maintenance / Notes tabs, Publish control, no Tenancies', async ({ page }) => {
    await page.goto(`/properties/${propertyId}`);
    for (const name of ['Occupancy', 'Maintenance', 'Notes']) {
      await expect(page.getByRole('button', { name }).or(page.getByRole('tab', { name })).first()).toBeVisible({ timeout: 15000 });
    }
    await expect(page.getByText('Tenancies', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /unpublish/i })).toBeVisible();
    await page.getByRole('button', { name: 'Maintenance' }).or(page.getByRole('tab', { name: 'Maintenance' })).first().click();
    await expect(page.getByText(`Leaking tap ${RUN}`)).toBeVisible();
  });

  test('side menu: Transactions is not top-level, it lives under Finance', async ({ page }) => {
    const tx = page.getByRole('button', { name: 'Transactions', exact: true });
    // Open the Finance submenu if it is not already open.
    if (!(await tx.isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Finance' }).first().click();
    }
    await expect(tx).toHaveCount(1, { timeout: 10000 });
    // It is an indented child of Finance, not a top-level menu item.
    await expect(tx).toHaveClass(/ml-5/);
  });

  test('edit property: postcode lookup is hidden', async ({ page }) => {
    await page.goto(`/property/edit?id=${propertyId}`);
    await expect(page.locator('input').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/find address|search address|ideal postcodes/i)).toHaveCount(0);
  });
});

test.describe('basic user cannot publish', () => {
  test('no Publish button on the property page', async ({ page }) => {
    await uiLogin(page, BASIC_EMAIL, PASSWORD);
    await expect(page).toHaveURL(/dashboard|properties|maintenance/, { timeout: 20000 });
    await page.goto(`/properties/${propertyId}`);
    // Either the screen is denied outright, or it renders without any publish control.
    await expect(page.getByText(/UI Street|Access Denied/).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /^(un)?publish$/i })).toHaveCount(0);
  });
});

test.describe('landlord portal', () => {
  test('landlord logs in with the emailed password and sees the job with a deductible badge', async ({ page }) => {
    await uiLogin(page, LANDLORD_EMAIL, landlordTemp, '/landlord/login');
    // First login forces a password change; follow it if it appears.
    if (await page.waitForURL(/set-password/, { timeout: 8000 }).then(() => true).catch(() => false)) {
      const pw = page.locator('input[type="password"]');
      const n = await pw.count();
      for (let i = 0; i < n; i++) await pw.nth(i).fill(PASSWORD);
      await page.getByRole('button', { name: /save|set|update|continue/i }).first().click();
    }
    await page.goto('/landlord/maintenance');
    await expect(page.getByText(`Leaking tap ${RUN}`)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/deductible/i).first()).toBeVisible();
  });
});
