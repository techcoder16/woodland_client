import type { JobType } from "@/redux/dataStore/jobTypeSlice";

type ReplyFields = Pick<JobType, "landlordReplyUnread" | "landlordInformedAt">;

// "Landlord" column on the Jobs list, colour only:
//   red   = the landlord replied and nobody has opened it yet;
//   black = landlord emailed (or their reply has been read);
//   empty = landlord not emailed.
// Opening the job's Landlord emails tab turns red back to black.
export function LandlordReplyCell({ job }: { job: ReplyFields }) {
  const colour = job.landlordReplyUnread ? "bg-red-600" : job.landlordInformedAt ? "bg-black" : "";
  const label = job.landlordReplyUnread ? "Landlord replied: not read yet" : job.landlordInformedAt ? "Landlord emailed" : undefined;
  return (
    <td className={`w-20 min-w-[5rem] p-0 ${colour}`} title={label} aria-label={label}>
      <span className="sr-only">{label}</span>
    </td>
  );
}

export default LandlordReplyCell;
