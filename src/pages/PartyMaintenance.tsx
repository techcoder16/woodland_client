import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, LogOut } from "lucide-react";
import { toast } from "sonner";
import { partyGet, partyPost, partyLogout, getPartyInfo, PartyKind } from "@/helper/partyAuth";
import { useNavigate } from "react-router-dom";

type ReportingStatus = "QUOTING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const STATUS_LABELS: Record<ReportingStatus, string> = {
  QUOTING: "Quoting",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const getStatusBadgeVariant = (status: ReportingStatus) => {
  switch (status) {
    case "COMPLETED": return "default";
    case "ASSIGNED":
    case "IN_PROGRESS": return "secondary";
    case "QUOTING": return "destructive";
    default: return "outline";
  }
};

interface JobType {
  id: string;
  jobType: string;
  description: string;
  dueDate: string;
  priority?: string;
  status: ReportingStatus;
  createdAt?: string;
  property?: { addressLine1?: string; addressLine2?: string; town?: string; postCode?: string };
}

const reportSchema = z.object({
  jobType: z.string().min(1, "Type is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.string().optional(),
});
type ReportFormData = z.infer<typeof reportSchema>;

const formatAddress = (property?: JobType["property"]) => {
  if (!property) return "-";
  return [property.addressLine1, property.addressLine2, property.town, property.postCode].filter(Boolean).join(", ");
};

const KIND_LOGIN: Record<PartyKind, string> = {
  vendor: "/landlord/login",
  tenant: "/tenant/login",
  contractor: "/contractor/login",
};

const PartyMaintenance = ({ kind }: { kind: PartyKind }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const canCreate = kind === "vendor" || kind === "tenant";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFormData>({ resolver: zodResolver(reportSchema) });

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await partyGet<any>(kind, "property-management/job-type?page=1&limit=50");
      const list = data?.jobTypes || [];
      setJobs(list);
      if (list.length > 0 && !propertyId) {
        setPropertyId(list[0].propertyId || list[0].property?.id || null);
      }
    } catch (error) {
      toast.error("Failed to load maintenance jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const onSubmit = async (data: ReportFormData) => {
    if (!propertyId) {
      toast.error("No property found on your account to report an issue for.");
      return;
    }
    try {
      await partyPost(kind, "property-management/job-type", { ...data, propertyId });
      toast.success("Maintenance request submitted");
      reset();
      setIsDialogOpen(false);
      loadJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    }
  };

  const handleLogout = async () => {
    await partyLogout(kind);
    navigate(KIND_LOGIN[kind]);
  };

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Maintenance</h1>
          <div className="flex items-center gap-2">
            {canCreate && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Report an issue
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report a maintenance issue</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobType">Type</Label>
                      <Input id="jobType" {...register("jobType")} placeholder="e.g., Leak, Broken window" />
                      {errors.jobType && <p className="text-sm text-destructive">{errors.jobType.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" {...register("description")} placeholder="Describe the issue..." />
                      {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Preferred date</Label>
                      <Input id="dueDate" type="date" {...register("dueDate")} />
                      {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Submit</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Button size="sm" variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {kind === "contractor" ? "Jobs assigned to you" : "Your maintenance requests"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {kind === "contractor" ? "No jobs assigned to you yet." : "No maintenance requests yet."}
              </p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="flex items-start justify-between border rounded-lg p-3">
                  <div>
                    <div className="font-medium">{job.jobType}</div>
                    <div className="text-sm text-muted-foreground">{job.description}</div>
                    {kind === "contractor" && (
                      <div className="text-xs text-muted-foreground mt-1">{formatAddress(job.property)}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">Due: {job.dueDate}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={getStatusBadgeVariant(job.status)}>{STATUS_LABELS[job.status] ?? job.status}</Badge>
                    {job.priority && <Badge variant="outline">{job.priority}</Badge>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartyMaintenance;
