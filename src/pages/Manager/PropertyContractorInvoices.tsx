import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InfoHint } from "@/components/ui/hint";
import ContractorInvoicePanel from "@/components/maintenance/ContractorInvoicePanel";
import type { JobType } from "@/redux/dataStore/jobTypeSlice";
import { get } from "@/helper/api";
import { useAuth } from "@/context/AuthContext";
import { Department } from "@/types/permissions";

const money = (value: number | null | undefined) => (value == null ? "-" : `£${Number(value).toFixed(2)}`);

// Jobs on this property that have a contractor or a cost. The job's own panel
// (ContractorInvoicePanel) generates and lists its invoices.
export default function PropertyContractorInvoices({ propertyId }: { propertyId: string }) {
  const { isDepartmentAdmin } = useAuth();
  const canManage = isDepartmentAdmin(Department.Maintenance);
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    setLoading(true);
    get<{ jobTypes: JobType[]; total: number }>(`property-management/job-type?propertyId=${propertyId}&page=1&limit=100`).then(({ data, error }) => {
      if (cancelled) return;
      setFailed(!!error);
      setJobs(Array.isArray(data?.jobTypes) ? data!.jobTypes : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [propertyId, version]);

  const rows = useMemo(
    () => jobs.filter((job) => job.contractorId || job.contractorRef || job.totalCost != null),
    [jobs],
  );

  return (
    <div className="space-y-5">
      <div className="surface p-5">
        <h2 className="flex items-center gap-1.5 font-semibold">
          Contractor invoices
          <InfoHint text="Contractor jobs on this property. Open a job to see its costs and generate the invoices for the landlord." />
        </h2>
        <p className="text-sm text-muted-foreground">Costs and invoices for maintenance jobs carried out by contractors.</p>
      </div>

      {loading && !jobs.length ? (
        <p className="p-6 text-sm text-muted-foreground">Loading contractor jobs…</p>
      ) : failed ? (
        <div className="surface p-8 text-center text-sm text-muted-foreground">Could not load the contractor jobs for this property.</div>
      ) : !rows.length ? (
        <div className="surface p-8 text-center text-sm text-muted-foreground">No contractor jobs on this property yet.</div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-3" />
                  <th className="px-4 py-3 font-medium">Job</th>
                  <th className="px-4 py-3 font-medium">Contractor</th>
                  <th className="px-4 py-3 text-right font-medium">Contractor cost</th>
                  <th className="px-4 py-3 text-right font-medium">Other cost</th>
                  <th className="px-4 py-3 text-right font-medium">Total chargeable</th>
                  <th className="px-4 py-3 font-medium">Landlord portal</th>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((job) => {
                  const isOpen = expandedId === job.id;
                  const otherCost = job.otherCost ?? null;
                  return (
                    <Fragment key={job.id}>
                      <tr className="cursor-pointer border-t hover:bg-muted/30" onClick={() => setExpandedId(isOpen ? null : job.id ?? null)}>
                        <td className="px-3 py-3 text-muted-foreground">{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{job.jobType}</div>
                          {job.description && <div className="max-w-[260px] truncate text-xs text-muted-foreground" title={job.description}>{job.description}</div>}
                        </td>
                        <td className="px-4 py-3">{job.contractorRef?.name || "-"}</td>
                        <td className="px-4 py-3 text-right">{money(job.totalCost)}</td>
                        <td className="px-4 py-3 text-right">{money(otherCost)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{job.totalCharged != null ? money(job.totalCharged) : <span className="font-normal text-muted-foreground">Not set</span>}</td>
                        <td className="px-4 py-3">
                          {job.showOnLandlordPortal ? <Badge className="bg-emerald-100 text-emerald-700">Shown</Badge> : <Badge variant="outline">Hidden</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          {job.landlordInvoiceFileId ? <Badge className="bg-blue-100 text-blue-700">Generated</Badge> : <span className="text-xs text-muted-foreground">None yet</span>}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-t bg-muted/20">
                          <td colSpan={8} className="px-6 py-4">
                            <ContractorInvoicePanel job={job} canManage={canManage} onChanged={() => setVersion((v) => v + 1)} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
