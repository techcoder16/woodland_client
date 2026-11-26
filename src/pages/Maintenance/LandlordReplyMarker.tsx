import type { JobType } from "@/redux/dataStore/jobTypeSlice";

type ReplyFields = Pick<JobType, "landlordReplyUnread" | "landlordInformedAt">;

// "Landlord" column on the Jobs list. The whole cell turns red while a landlord reply
// is unread; once someone opens the job's Landlord emails tab it goes back to plain
// "Emailed". Empty when the landlord hasn't been emailed.
export function LandlordReplyCell({ job }: { job: ReplyFields }) {
  if (job.landlordReplyUnread) {
    return (
      <td className="whitespace-nowrap bg-red-600 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-white" title="Landlord replied: not read yet">
        Reply
      </td>
    );
  }
  return (
    <td className="whitespace-nowrap px-3 py-3 text-center text-xs text-muted-foreground" title={job.landlordInformedAt ? "Landlord emailed: no unread reply" : undefined}>
      {job.landlordInformedAt ? "Emailed" : "-"}
    </td>
  );
}

export default LandlordReplyCell;
