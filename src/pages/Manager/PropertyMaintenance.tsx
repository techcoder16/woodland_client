import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { get } from "@/helper/api";

const STATUS_BADGE: Record<string, string> = {
  QUOTING: "bg-slate-100 text-slate-700",
  ASSIGNED: "bg-orange-100 text-orange-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  CONTRACTOR_DONE: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default function PropertyMaintenance({ propertyId }: { propertyId: string }) {
  const navigate = useNavigate();
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    get<{ jobTypes: any[] }>(`property-management/job-type?propertyId=${propertyId}&limit=50`).then(({ data }) => {
      setJobTypes(data?.jobTypes || []);
      setLoading(false);
    });
  }, [propertyId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Maintenance</h2>
          <p className="text-sm text-muted-foreground">Maintenance jobs reported for this property.</p>
        </div>
        <Button onClick={() => navigate("/maintenance")}>Manage in Maintenance</Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && !jobTypes.length && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No maintenance jobs for this property yet.
        </div>
      )}

      {!loading && jobTypes.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr><th className="px-4 py-2.5">Job</th><th className="px-4 py-2.5">Priority</th><th className="px-4 py-2.5">Due date</th><th className="px-4 py-2.5">Status</th></tr>
            </thead>
            <tbody>
              {jobTypes.map((j: any) => (
                <tr key={j.id} className="border-t">
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{j.jobType}</p>
                    <p className="text-xs text-muted-foreground">{j.location || j.description}</p>
                  </td>
                  <td className="px-4 py-2.5">{j.priority || "-"}</td>
                  <td className="px-4 py-2.5">{j.dueDate || "-"}</td>
                  <td className="px-4 py-2.5"><Badge className={STATUS_BADGE[j.status] || "bg-slate-100 text-slate-700"}>{j.status?.replace("_", " ")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
