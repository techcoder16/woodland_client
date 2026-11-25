import type { JobType } from "@/redux/dataStore/jobTypeSlice";

// Square on the Jobs list once the landlord has been emailed: red while a logged
// landlord reply is unread, black once someone has opened the job's Landlord emails tab.
export default function LandlordReplyMarker({ job }: { job: Pick<JobType, "landlordReplyUnread" | "landlordInformedAt"> }) {
  if (job.landlordReplyUnread) {
    return <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm bg-red-600 ring-2 ring-red-200" title="Landlord replied: not read yet" aria-label="Unread landlord reply" />;
  }
  if (job.landlordInformedAt) {
    return <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm bg-foreground" title="Landlord emailed: no unread reply" aria-label="Landlord emailed" />;
  }
  return null;
}
