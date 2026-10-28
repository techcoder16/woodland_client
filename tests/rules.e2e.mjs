// Business-rule checks against a live API (prod by default). Creates only
// TEST-E2E records, never marks anything paid, and removes what it made.
//   node --env-file=.env.test --test tests/rules.e2e.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

const API = process.env.E2E_API_URL;
const made = { jobs: [], transactions: [], properties: [], vendors: [] };
let admin, client;

async function call(token, method, path, body) {
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function login(email, password) {
  assert.ok(email && password, "Fill the logins in .env.test");
  const r = await call(null, "POST", "auth/login", { email, password });
  assert.equal(r.status < 300, true, `login ${email}: ${r.status} ${JSON.stringify(r.data)}`);
  return r.data.accessToken;
}

const ok = (r, what) => assert.ok(r.status < 300, `${what}: ${r.status} ${JSON.stringify(r.data)}`);
const rejected = (r, what) => {
  // A rule gap still creates the record: track it so cleanup removes it.
  const id = r.data?.property?.id ?? r.data?.transaction?.id;
  if (r.status < 300 && id) (r.data.property ? made.properties : made.transactions).push(id);
  rejectedStatus(r, what);
};
const rejectedStatus = (r, what) => assert.ok(r.status >= 400 && r.status < 500, `${what} should be refused, got ${r.status}`);

async function newVendor(tag) {
  const r = await call(admin, "POST", "vendor/create", { firstName: "TEST-E2E", lastName: tag, phone: "07000000000" });
  ok(r, "create landlord");
  made.vendors.push(r.data.vendor.id);
  return r.data.vendor.id;
}

async function newProperty(vendor) {
  const r = await call(admin, "POST", "properties", {
    vendor, addressLine1: `TEST-E2E ${Date.now()}`, country: "United Kingdom", propertyStatus: "DRAFT",
  });
  ok(r, "create property");
  made.properties.push(r.data.property.id);
  return r.data.property.id;
}

// 1x1 PNG: maintenance jobs need at least one photo.
async function uploadPhoto(propertyId) {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=", "base64");
  const start = await call(admin, "POST", "files/uploads", {
    fileName: "e2e.png", contentType: "image/png", size: png.length, category: "job-media", entityType: "jobType", propertyId,
  });
  ok(start, "start upload");
  const put = await fetch(start.data.url, { method: "PUT", headers: { "Content-Type": "image/png" }, body: png });
  assert.ok(put.ok, `S3 upload: ${put.status}`);
  ok(await call(admin, "POST", `files/uploads/${start.data.fileId}/complete`, {}), "complete upload");
  return start.data.fileId;
}

async function newJob(token, propertyId) {
  const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const r = await call(token, "POST", "property-management/job-type", {
    propertyId, jobType: "Plumbing", location: "Kitchen", description: "TEST-E2E leak", dueDate: due,
    mediaFileIds: [await uploadPhoto(propertyId)],
  });
  ok(r, "create job");
  made.jobs.push(r.data.jobType.id);
  return r.data.jobType.id;
}

before(async () => {
  assert.ok(API, "Set E2E_API_URL in .env.test");
  admin = await login(process.env.E2E_ADMIN_EMAIL, process.env.E2E_ADMIN_PASSWORD);
  client = await login(process.env.E2E_CLIENT_EMAIL, process.env.E2E_CLIENT_PASSWORD);
});

// Reverse order: jobs and transactions hold the property, properties hold the landlord.
after(async () => {
  for (const id of made.jobs) await call(admin, "POST", `property-management/job-type/${id}/delete`);
  for (const id of made.transactions) await call(admin, "DELETE", `transaction/${id}`);
  for (const id of made.properties) await call(admin, "DELETE", `properties/${id}`);
  for (const id of made.vendors) await call(admin, "DELETE", `vendor/delete/${id}`);
});

test("a property cannot be created without a landlord", async () => {
  rejected(await call(admin, "POST", "properties", { addressLine1: "TEST-E2E orphan", country: "United Kingdom", propertyStatus: "DRAFT" }), "property with no landlord");
  rejected(await call(admin, "POST", "properties", { vendor: "", addressLine1: "TEST-E2E orphan", country: "United Kingdom" }), "property with empty landlord");
});

test("a property created with a landlord stays linked", async () => {
  const vendor = await newVendor("linked");
  const id = await newProperty(vendor);
  rejected(await call(admin, "PATCH", `properties/${id}`, { vendor: "" }), "unlinking the landlord");
  const other = await newVendor("reassign");
  ok(await call(admin, "PATCH", `properties/${id}`, { vendor: other }), "reassign to another landlord");
});

test("a landlord with properties cannot be deleted", async () => {
  const vendor = await newVendor("delete-guard");
  await newProperty(vendor);
  rejected(await call(admin, "DELETE", `vendor/delete/${vendor}`), "deleting a linked landlord");
});

test("transactions need a property with a landlord", async () => {
  rejected(await call(admin, "POST", "transaction", { description: "TEST-E2E" }), "transaction with no property");
  rejected(await call(admin, "POST", "transaction", { propertyId: "does-not-exist", description: "TEST-E2E" }), "transaction on a missing property");
  const property = await newProperty(await newVendor("money"));
  const r = await call(admin, "POST", "transaction", { propertyId: property, description: "TEST-E2E rent", fromTenantRentReceived: 1 });
  ok(r, "transaction on a linked property");
  made.transactions.push(r.data.transaction.id);
});

test("only a maintenance admin approves or completes jobs", async () => {
  const property = await newProperty(await newVendor("maintenance"));
  const job = await newJob(client, property);
  rejected(await call(client, "POST", `property-management/job-type/${job}`, { status: "COMPLETED" }), "client completing a job");
  rejected(await call(client, "POST", `property-management/job-type/${job}`, { status: "ASSIGNED" }), "client approving a job");
  rejected(await call(client, "POST", `property-management/job-type/${job}/delete`), "client deleting a job");
  ok(await call(admin, "POST", `property-management/job-type/${job}`, { status: "IN_PROGRESS" }), "admin moving the job on");
});

test("a client cannot delete properties or landlords", async () => {
  const vendor = await newVendor("client-delete");
  const property = await newProperty(vendor);
  rejected(await call(client, "DELETE", `properties/${property}`), "client deleting a property");
  rejected(await call(client, "DELETE", `vendor/delete/${vendor}`), "client deleting a landlord");
});
