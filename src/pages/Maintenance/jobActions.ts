// Shared API calls and helpers for maintenance jobs (Jobs page, Job detail page,
// Chase Up page). Every call goes through helper/api, which resolves with
// { data, error } instead of throwing; these wrappers throw on error so callers
// can show the server message in a toast.
import { get, post } from "@/helper/api";
import { formatLocalDate } from "@/helper/formatLocalDate";
import type { JobNote, JobType } from "@/redux/dataStore/jobTypeSlice";
import { formatLondonDate } from "@/utils/maintenanceSla";

type ApiResult<T> = { data: T | null; error: { message: string } | null };

function unwrap<T>(result: ApiResult<T>): T {
  if (result.error) throw new Error(result.error.message || "Request failed");
  return (result.data ?? {}) as T;
}

/** Updates a job. The server needs propertyId on every job update. */
export async function patchJob<T = unknown>(job: Pick<JobType, "id" | "propertyId">, body: Record<string, unknown>): Promise<T> {
  if (!job.id) throw new Error("Job has no id");
  return unwrap<T>(await post<T>(`property-management/job-type/${job.id}`, { propertyId: job.propertyId, ...body }));
}

export async function fetchJobNotes(jobId: string): Promise<JobNote[]> {
  const data = unwrap<{ notes?: JobNote[] }>(await get<{ notes?: JobNote[] }>(`property-management/job-type/${jobId}/notes`));
  return data.notes ?? [];
}

export async function addJobNote(jobId: string, note: string, kind: "NOTE" | "CHASE_UP" = "NOTE") {
  return unwrap(await post(`property-management/job-type/${jobId}/notes`, { note, kind }));
}

export async function markJobDone(job: JobType) {
  return patchJob(job, { dateDone: formatLocalDate(new Date()), status: "COMPLETED" });
}

/** Sends the job back to the contractor (ASSIGNED) and records why as a note. */
export async function markJobNotComplete(job: JobType, note: string) {
  await patchJob(job, { status: "ASSIGNED" });
  await addJobNote(job.id as string, note, "NOTE");
}

export async function cancelJob(job: JobType) {
  return patchJob(job, { status: "CANCELLED" });
}

export async function setVisit(job: JobType, visitDate: string, time: string) {
  return patchJob(job, { visitDate, time });
}

export async function emailLandlord(jobId: string, invoicePdfBase64?: string, message?: string) {
  return unwrap<{ message?: string; to?: string; status?: string }>(
    await post<{ message?: string; to?: string; status?: string }>(
      `property-management/job-type/${jobId}/email-landlord`,
      { ...(invoicePdfBase64 ? { invoicePdfBase64 } : {}), ...(message ? { message } : {}) },
    ),
  );
}

export async function markLandlordAuthorised(jobId: string, note?: string) {
  return unwrap(await post(`property-management/job-type/${jobId}/landlord-authorised`, note ? { note } : {}));
}

/** "Tue 24 Nov 2026 at 10:00", or "Not scheduled". */
export function formatVisit(job: Pick<JobType, "visitDate" | "time">): string {
  if (!job.visitDate) return "Not scheduled";
  const date = formatLondonDate(job.visitDate);
  return job.time ? `${date} at ${job.time}` : date;
}

export function formatJobAddress(property?: JobType["property"]): string {
  if (!property) return "-";
  return [property.addressLine1, property.addressLine2, property.town, property.postCode].filter(Boolean).join(", ") || "-";
}
