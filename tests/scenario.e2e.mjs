// Full business scenario on a live API, run as every role. Unlike rules.e2e.mjs
// it KEEPS its data (all named TEST-E2E) so it can be checked in the app, and it
// never marks anything paid. Missing logins are created and saved to .env.test.
//   node --env-file=.env.test --test --test-concurrency=1 tests/scenario.e2e.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";

const API = process.env.E2E_API_URL;
const ENV_FILE = new URL(`../${process.env.E2E_ENV_FILE ?? ".env.test"}`, import.meta.url);
const today = new Date().toISOString().slice(0, 10);
const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const s = {}; // ids shared between steps
const tok = {}; // tokens per role
const logins = []; // printed at the end

async function call(token, method, path, body) {
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": randomBytes(8).toString("hex"),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}
const ok = (r, what) => { assert.ok(r.status < 300, `${what}: ${r.status} ${JSON.stringify(r.data).slice(0, 300)}`); return r.data; };
const refused = (r, what) => assert.ok(r.status === 401 || r.status === 403, `${what} should be forbidden, got ${r.status}`);
// Someone else's record: forbidden or not found, never returned.
const hidden = (r, what) => assert.ok([401, 403, 404].includes(r.status), `${what} should be hidden, got ${r.status}`);
const password = () => `E2e-${randomBytes(9).toString("base64url")}9!`;

// Reuses a saved login, or creates the person and saves the login to .env.test.
function saved(key) {
  return { email: process.env[`E2E_${key}_EMAIL`], password: process.env[`E2E_${key}_PASSWORD`] };
}
function remember(key, role, email, pw) {
  if (!process.env[`E2E_${key}_EMAIL`]) appendFileSync(ENV_FILE, `E2E_${key}_EMAIL=${email}\nE2E_${key}_PASSWORD=${pw}\n`);
  process.env[`E2E_${key}_EMAIL`] = email;
  process.env[`E2E_${key}_PASSWORD`] = pw;
  logins.push({ role, email, password: pw });
}

async function staffLogin(key, role, user) {
  let { email, password: pw } = saved(key);
  if (!email) {
    email = user.email;
    pw = password();
    ok(await call(tok.super, "POST", "user", { ...user, password: pw }), `create ${role} user`);
  }
  const r = ok(await call(null, "POST", "auth/login", { email, password: pw }), `${role} login`);
  remember(key, role, email, pw);
  return r.accessToken;
}

// Portal people (landlord / tenant / contractor) get a staff-set password, then log in.
async function partyLogin(kind, key, role, id, email) {
  const pw = saved(key).password ?? password();
  ok(await call(tok.super, "PATCH", `auth/${kind}/${id}/set-password`, { password: pw }), `set ${role} password`);
  const r = ok(await call(null, "POST", `auth/${kind}/login`, { email, password: pw }), `${role} login`);
  remember(key, role, email, pw);
  return r.accessToken ?? r.access_token;
}

async function uploadPhoto(token, propertyId, category = "job-media", entityType = "jobType") {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=", "base64");
  const start = ok(await call(token, "POST", "files/uploads", {
    fileName: "leak.png", contentType: "image/png", size: png.length, category, entityType, propertyId,
  }), "start upload");
  const put = await fetch(start.url, { method: "PUT", headers: { "Content-Type": "image/png" }, body: png });
  assert.ok(put.ok, `S3 upload: ${put.status}`);
  ok(await call(token, "POST", `files/uploads/${start.fileId}/complete`, {}), "complete upload");
  return start.fileId;
}

const tag = Date.now().toString(36).toUpperCase();

before(async () => {
  assert.ok(API, "Set E2E_API_URL in .env.test");
  const a = saved("ADMIN");
  tok.super = ok(await call(null, "POST", "auth/login", a), "super login").accessToken;
  logins.push({ role: "Super user", ...a });
});

after(() => {
  console.log(`\nScenario ${tag} — logins (https://pms.woodlandltd.com; portals use the same site):`);
  console.table(logins);
  console.log("Records:", s);
});

test("staff users: client, finance and maintenance admin can log in", async () => {
  tok.client = await staffLogin("CLIENT", "Client (basic user)", {
    email: "e2e-client@woodlandltd.com", first_name: "E2E", last_name: "Client", role: "BASIC_USER", department: "PROPERTIES",
  });
  tok.finance = await staffLogin("FINANCE", "Finance user", {
    email: "e2e-finance@woodlandltd.com", first_name: "E2E", last_name: "Finance", role: "FINANCE_USER", department: "OTHER",
  });
  tok.maint = await staffLogin("MAINT", "Maintenance admin", {
    email: "e2e-maintenance@woodlandltd.com", first_name: "E2E", last_name: "Maintenance", role: "DEPARTMENT_ADMIN", department: "MAINTENANCE",
  });
});

test("two landlords, each with properties (never without a landlord)", async () => {
  for (const n of [1, 2]) {
    const v = ok(await call(tok.super, "POST", "vendor/create", {
      firstName: "TEST-E2E", lastName: `Landlord ${n} ${tag}`, email: `e2e-landlord${n}-${tag.toLowerCase()}@example.com`,
      phone: "07000000000", addressLine1: `${n} Test Street`, town: "London", postCode: "SW1A 1AA", country: "United Kingdom",
    }), `create landlord ${n}`).vendor;
    s[`landlord${n}`] = v.id;
    s[`landlord${n}Email`] = v.email;
  }
  const props = [["landlord1", "Flat 1"], ["landlord1", "Flat 2"], ["landlord2", "House 1"]];
  for (const [i, [owner, name]] of props.entries()) {
    const p = ok(await call(tok.super, "POST", "properties", {
      vendor: s[owner], addressLine1: `TEST-E2E ${name} ${tag}`, town: "London", postCode: "SW1A 1AA", country: "United Kingdom",
      for: "Rent", category: "Residential", price: "1200", bedrooms: "2", bathrooms: "1", propertyStatus: "PUBLISHED",
    }), `create ${name}`).property;
    assert.equal(p.vendorId, s[owner], `${name} is linked to its landlord`);
    s[`property${i + 1}`] = p.id;
  }
  assert.ok((await call(tok.super, "POST", "properties", { addressLine1: "TEST-E2E orphan", country: "United Kingdom" })).status >= 400, "property without landlord refused");
});

test("landlord portal: sees only their own properties", async () => {
  tok.landlord = await partyLogin("vendor", "LANDLORD", "Landlord (portal)", s.landlord1, s.landlord1Email);
  const mine = JSON.stringify(ok(await call(tok.landlord, "GET", "property-management/my-property"), "landlord properties"));
  assert.ok(mine.includes(s.property1) && mine.includes(s.property2), "landlord 1 sees both flats");
  assert.ok(!mine.includes(s.property3), "landlord 1 does not see landlord 2's house");
});

test("occupancy: a tenant moves into Flat 1 and can log in", async () => {
  const o = ok(await call(tok.super, "POST", "occupancy", {
    propertyId: s.property1, type: "PRIVATE", privateCustomerKind: "INDIVIDUAL",
    customerFirstName: "TEST-E2E", customerSurname: `Tenant ${tag}`, customerEmail: `e2e-tenant-${tag.toLowerCase()}@example.com`,
    occupier: { FirstName: "TEST-E2E", SureName: `Tenant ${tag}`, Email: `e2e-tenant-${tag.toLowerCase()}@example.com`, MobileNo: "07000000001" },
    moveInDate: today, expectedMoveOutDate: inDays(180), rateAmount: 1200, rateFrequency: "MONTHLY",
  }), "create occupancy");
  s.occupancy = o.id;
  s.tenant = o.occupierId;
  ok(await call(tok.super, "PATCH", `occupancy/${o.id}/status`, { status: "ACTIVE" }), "move tenant in");
  tok.tenant = await partyLogin("tenant", "TENANT", "Tenant (portal)", s.tenant, `e2e-tenant-${tag.toLowerCase()}@example.com`);
  const home = JSON.stringify(ok(await call(tok.tenant, "GET", "property-management/my-property"), "tenant property"));
  assert.ok(home.includes(s.property1), "tenant sees Flat 1");
});

test("maintainer: contractor created and can log in", async () => {
  const c = ok(await call(tok.super, "POST", "contractor/create", {
    name: `TEST-E2E Plumbing ${tag}`, specialty: "Plumbing", email: `e2e-contractor-${tag.toLowerCase()}@example.com`, phone: "07000000002",
  }), "create contractor").contractor;
  s.contractor = c.id;
  tok.contractor = await partyLogin("contractor", "CONTRACTOR", "Contractor (portal)", c.id, c.email);
});

test("maintenance: reported by client, approved by maintenance admin, done by contractor", async () => {
  const job = ok(await call(tok.client, "POST", "property-management/job-type", {
    propertyId: s.property1, jobType: "Plumbing", location: "Kitchen", description: `TEST-E2E leaking sink ${tag}`,
    dueDate: inDays(14), mediaFileIds: [(s.photo = await uploadPhoto(tok.client, s.property1))],
  }), "client reports job").jobType;
  s.job = job.id;
  const path = `property-management/job-type/${job.id}`;

  refused(await call(tok.client, "POST", path, { contractorId: s.contractor }), "client assigning a contractor");
  refused(await call(tok.client, "POST", path, { status: "COMPLETED" }), "client completing the job");
  refused(await call(tok.contractor, "POST", path, { status: "CONTRACTOR_DONE" }), "contractor on a job not assigned to them");

  ok(await call(tok.maint, "POST", path, { contractorId: s.contractor, status: "ASSIGNED", totalCost: 150, marginPercent: 20 }), "maintenance admin approves and assigns");
  refused(await call(tok.contractor, "POST", path, { status: "COMPLETED" }), "contractor closing the job");
  ok(await call(tok.contractor, "POST", path, { status: "CONTRACTOR_DONE", startDate: today, endDate: today }), "contractor marks done");
  const done = ok(await call(tok.maint, "POST", path, { status: "COMPLETED" }), "maintenance admin signs off");
  assert.equal((done.jobType ?? done).status, "COMPLETED");
});

test("transactions: finance raises, only an admin approves; nothing is paid", async () => {
  refused(await call(tok.client, "POST", "transaction", { propertyId: s.property1 }), "client creating a transaction");
  const t = ok(await call(tok.finance, "POST", "transaction", {
    propertyId: s.property1, description: `TEST-E2E rent ${tag}`, fromTenantDate: today, fromTenantRentReceived: 1200,
    toLandlordRentReceived: 1200, toLandlordLessManagementFees: 120, toLandlordLessBuildingExpenditure: 180, toLandlordNetPaid: 900,
    jobTypeIds: [s.job],
  }), "finance creates transaction").transaction;
  s.transaction = t.id;
  ok(await call(tok.finance, "POST", `transaction/${t.id}/request-approval`), "finance requests approval");
  refused(await call(tok.finance, "POST", `transaction/${t.id}/approve`), "finance approving their own transaction");
  ok(await call(tok.super, "POST", `transaction/${t.id}/approve`), "admin approves");
  assert.ok((await call(tok.super, "POST", "transaction", { description: "TEST-E2E no property" })).status >= 400, "transaction without property refused");
});

test("landlord protection: cannot be deleted or unlinked while it has properties", async () => {
  assert.ok((await call(tok.super, "DELETE", `vendor/delete/${s.landlord1}`)).status >= 400, "landlord with properties not deletable");
  assert.ok((await call(tok.super, "PATCH", `properties/${s.property1}`, { vendor: "" })).status >= 400, "landlord not removable");
  refused(await call(tok.client, "DELETE", `properties/${s.property3}`), "client deleting a property");
});

test("second household: tenant in House 1, second contractor, landlord 2 portal", async () => {
  const email = `e2e-tenant2-${tag.toLowerCase()}@example.com`;
  const o = ok(await call(tok.super, "POST", "occupancy", {
    propertyId: s.property3, type: "PRIVATE", privateCustomerKind: "INDIVIDUAL", customerFirstName: "TEST-E2E", customerSurname: `Tenant2 ${tag}`,
    customerEmail: email, occupier: { FirstName: "TEST-E2E", SureName: `Tenant2 ${tag}`, Email: email },
    moveInDate: today, rateAmount: 250, rateFrequency: "WEEKLY",
  }), "create second occupancy");
  s.occupancy2 = o.id;
  s.tenant2 = o.occupierId;
  ok(await call(tok.super, "PATCH", `occupancy/${o.id}/status`, { status: "ACTIVE" }), "move second tenant in");
  tok.tenant2 = await partyLogin("tenant", "TENANT2", "Tenant 2 (portal)", s.tenant2, email);
  tok.landlord2 = await partyLogin("vendor", "LANDLORD2", "Landlord 2 (portal)", s.landlord2, s.landlord2Email);
  const c = ok(await call(tok.super, "POST", "contractor/create", { name: `TEST-E2E Electrics ${tag}`, specialty: "Electrical", email: `e2e-contractor2-${tag.toLowerCase()}@example.com` }), "create second contractor").contractor;
  s.contractor2 = c.id;
  tok.contractor2 = await partyLogin("contractor", "CONTRACTOR2", "Contractor 2 (portal)", c.id, c.email);
});

test("portal isolation: each party sees only its own property, job and files", async () => {
  const job = `property-management/job-type/${s.job}`;
  const see = async (token, who) => { const r = ok(await call(token, "GET", job), `${who} views the Flat 1 job`); return r.jobType ?? r; };

  const t = await see(tok.tenant, "tenant 1");
  assert.ok(!("totalCost" in t) && !("marginPercent" in t), "tenant does not see Woodland cost or margin");
  const l = await see(tok.landlord, "landlord 1");
  assert.ok(!("totalCost" in l) && !("marginPercent" in l), "landlord does not see Woodland cost or margin");
  assert.equal(l.totalCharged, 180, "landlord sees what they are charged (150 + 20%)");
  const c = await see(tok.contractor, "assigned contractor");
  assert.ok(!("totalCharged" in c) && !("marginPercent" in c), "contractor does not see landlord charge or margin");

  hidden(await call(tok.tenant2, "GET", job), "tenant 2 viewing the Flat 1 job");
  hidden(await call(tok.landlord2, "GET", job), "landlord 2 viewing the Flat 1 job");
  hidden(await call(tok.contractor2, "GET", job), "unassigned contractor viewing the job");
  const list = JSON.stringify((await call(tok.contractor2, "GET", "property-management/job-type")).data);
  assert.ok(!list.includes(s.job), "unassigned contractor job list leaves it out");

  for (const [token, who] of [[tok.landlord2, "landlord 2"], [tok.tenant2, "tenant 2"]]) {
    const mine = JSON.stringify(ok(await call(token, "GET", "property-management/my-property"), `${who} properties`));
    assert.ok(mine.includes(s.property3) && !mine.includes(s.property1), `${who} sees House 1 only`);
  }

  const urls = (token) => call(token, "POST", "files/urls", { ids: [s.photo] });
  const staff = ok(await urls(tok.super), "staff file link")[s.photo];
  assert.ok(staff, "staff gets a link to the job photo");
  if (!staff.url.includes("/files/")) assert.equal((await fetch(staff.url)).status, 200, "the photo link opens");
  assert.ok(ok(await urls(tok.tenant), "tenant 1 file link")[s.photo], "tenant 1 can open their job photo");
  assert.ok(!(await urls(tok.tenant2)).data?.[s.photo], "tenant 2 cannot open the Flat 1 photo");
  assert.ok(!(await urls(tok.contractor2)).data?.[s.photo], "unassigned contractor cannot open the photo");
});

test("tenant reports from the portal, only for their own home", async () => {
  const body = (propertyId) => ({ propertyId, jobType: "Plumbing", location: "Bathroom", description: `TEST-E2E dripping tap ${tag}`, dueDate: inDays(10) });
  const own = ok(await call(tok.tenant, "POST", "property-management/job-type", { ...body(s.property1), mediaFileIds: [await uploadPhoto(tok.tenant, s.property1)] }), "tenant reports for Flat 1");
  s.tenantJob = (own.jobType ?? own).id;
  hidden(await call(tok.tenant, "POST", "property-management/job-type", { ...body(s.property3), mediaFileIds: [s.photo] }), "tenant reporting for another house");
  refused(await call(tok.contractor, "POST", "property-management/job-type", { ...body(s.property1), mediaFileIds: [s.photo] }), "contractor raising a job");
  refused(await call(tok.tenant, "POST", `property-management/job-type/${s.tenantJob}`, { status: "COMPLETED" }), "tenant closing their own job");
});

test("roles: other departments and ADMIN_USER", async () => {
  tok.lettings = await staffLogin("LETTINGS", "Lettings dept admin", {
    email: "e2e-lettings@woodlandltd.com", first_name: "E2E", last_name: "Lettings", role: "DEPARTMENT_ADMIN", department: "LETTINGS",
  });
  tok.adminUser = await staffLogin("ADMINUSER", "Admin user", {
    email: "e2e-adminuser@woodlandltd.com", first_name: "E2E", last_name: "AdminUser", role: "ADMIN_USER", department: "OTHER",
  });
  const job = `property-management/job-type/${s.tenantJob}`;
  refused(await call(tok.lettings, "POST", job, { contractorId: s.contractor }), "lettings admin assigning a contractor");
  refused(await call(tok.lettings, "POST", job, { status: "ASSIGNED" }), "lettings admin approving a maintenance job");
  ok(await call(tok.maint, "POST", job, { contractorId: s.contractor2, status: "ASSIGNED", totalCost: 60, marginAmount: 15 }), "maintenance admin assigns contractor 2");

  const t = ok(await call(tok.finance, "POST", "transaction", { propertyId: s.property3, description: `TEST-E2E weekly rent ${tag}`, fromTenantDate: today, fromTenantRentReceived: 250 }), "finance raises House 1 rent").transaction;
  s.transaction2 = t.id;
  ok(await call(tok.finance, "POST", `transaction/${t.id}/request-approval`), "request approval");
  refused(await call(tok.maint, "POST", `transaction/${t.id}/approve`), "maintenance admin approving money");
  refused(await call(tok.client, "POST", `transaction/${t.id}/approve`), "client approving money");
  ok(await call(tok.adminUser, "POST", `transaction/${t.id}/approve`), "ADMIN_USER approves");

  refused(await call(tok.finance, "DELETE", `properties/${s.property3}`), "finance deleting a property");
  refused(await call(tok.maint, "DELETE", `vendor/delete/${s.landlord2}`), "maintenance admin deleting a landlord");
  refused(await call(tok.client, "POST", "user", { email: "e2e-nope@example.com", password: password(), first_name: "No", last_name: "Pe" }), "client creating a staff user");
  refused(await call(tok.tenant, "POST", "transaction", { propertyId: s.property1 }), "tenant creating a transaction");
  refused(await call(tok.landlord, "POST", "transaction", { propertyId: s.property1 }), "landlord creating a transaction");
});

test("compliance: gas certificate on Flat 1, staff only", async () => {
  const fileId = await uploadPhoto(tok.super, s.property1, "compliance", "property");
  const doc = ok(await call(tok.super, "POST", "property-management/compliance", {
    propertyId: s.property1, docType: "GAS_SAFETY", label: `TEST-E2E gas ${tag}`, startDate: today, expiryDate: inDays(365), fileId,
  }), "add gas certificate");
  s.compliance = (doc.document ?? doc).id;
  assert.ok(JSON.stringify(ok(await call(tok.super, "GET", `property-management/compliance/${s.property1}`), "list certificates")).includes(`TEST-E2E gas ${tag}`));
  refused(await call(tok.tenant, "POST", "property-management/compliance", { propertyId: s.property1, docType: "EPC" }), "tenant adding a certificate");
});

test("occupancy ends: House 1 tenant gives notice and moves out", async () => {
  ok(await call(tok.super, "PATCH", `occupancy/${s.occupancy2}/status`, { status: "ENDING", expectedMoveOutDate: inDays(7) }), "notice given");
  ok(await call(tok.super, "PATCH", `occupancy/${s.occupancy2}/status`, { status: "ENDED", actualMoveOutDate: inDays(7) }), "moved out");
  const r = ok(await call(tok.super, "GET", `occupancy/${s.occupancy2}`), "read occupancy");
  assert.equal(r.status, "ENDED");
});

// Paying locks a transaction for good, so this only runs where E2E_ALLOW_PAID=1 (dev).
test("payment: only approved transactions are paid, and paid ones are locked", { skip: process.env.E2E_ALLOW_PAID !== "1" && "set E2E_ALLOW_PAID=1 (dev only)" }, async () => {
  const t = ok(await call(tok.finance, "POST", "transaction", {
    propertyId: s.property1, description: `TEST-E2E landlord payout ${tag}`, fromTenantDate: today, fromTenantRentReceived: 1200,
    toLandlordDate: today, toLandlordRentReceived: 1200, toLandlordLessManagementFees: 120, toLandlordNetPaid: 1080,
  }), "finance raises payout").transaction;
  s.paidTransaction = t.id;
  ok(await call(tok.finance, "POST", `transaction/${t.id}/request-approval`), "request approval");
  assert.ok((await call(tok.finance, "POST", `transaction/${t.id}/mark-paid`)).status >= 400, "cannot pay before approval");
  ok(await call(tok.super, "POST", `transaction/${t.id}/approve`), "admin approves");
  refused(await call(tok.client, "POST", `transaction/${t.id}/mark-paid`), "client marking paid");
  ok(await call(tok.finance, "POST", `transaction/${t.id}/mark-paid`), "finance marks paid");
  assert.ok((await call(tok.finance, "POST", `transaction/${t.id}/mark-paid`)).status >= 400, "cannot pay twice");
  assert.ok((await call(tok.super, "PATCH", `transaction/${t.id}`, { toLandlordNetPaid: 1 })).status >= 400, "paid amount cannot be edited");
  assert.ok((await call(tok.super, "DELETE", `transaction/${t.id}`)).status >= 400, "paid transaction cannot be deleted");
});
