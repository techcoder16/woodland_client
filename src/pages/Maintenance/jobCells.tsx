// Table cells shared by the Jobs and Chase Up lists.
import type { JobType } from "@/redux/dataStore/jobTypeSlice";
import { priorityTextClass } from "@/utils/priorityStyle";
import { formatLondonDate, formatLondonDateTime, isJobOverdue, jobDueValue } from "@/utils/maintenanceSla";

export const AddressCell = ({ property }: { property?: JobType["property"] }) => {
  if (!property) return <span className="text-muted-foreground">-</span>;
  const line2 = [property.town, property.postCode].filter(Boolean).join(", ");
  return (
    <div className="min-w-[10rem] max-w-[16rem]">
      <div className="font-medium leading-snug">
        {[property.addressLine1, property.addressLine2].filter(Boolean).join(", ") || "-"}
      </div>
      {line2 && <div className="text-xs text-muted-foreground leading-snug">{line2}</div>}
    </div>
  );
};

export const DueCell = ({ job }: { job: JobType }) => {
  const due = jobDueValue(job);
  if (!due) return <span className="text-muted-foreground">-</span>;
  const overdue = isJobOverdue(job);
  return (
    <div className={`whitespace-nowrap text-sm ${priorityTextClass(job.priority, overdue)}`}>
      {job.dueAt ? formatLondonDateTime(job.dueAt) : formatLondonDate(due)}
      {overdue && <div className="text-xs font-semibold text-red-600">Overdue</div>}
    </div>
  );
};
