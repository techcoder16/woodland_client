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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Download, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { partyGet, partyPost, getPartyInfo, PartyKind } from "@/helper/partyAuth";
import PartyDashboardLayout from "@/components/layout/PartyDashboardLayout";
import { generateMaintenanceInvoicePdf } from "@/helper/generateMaintenanceInvoice";
import { JOB_TYPE_OPTIONS, JOB_LOCATION_OPTIONS } from "@/helper/jobTypeOptions";
import { formatLocalDate } from "@/helper/formatLocalDate";
import { renderLabel } from "@/utils/FieldLabel";
import FileUploadField from "@/utils/FileUploadField";

type ReportingStatus = "QUOTING" | "ASSIGNED" | "IN_PROGRESS" | "CONTRACTOR_DONE" | "COMPLETED" | "CANCELLED";

const STATUS_LABELS: Record<ReportingStatus, string> = {
  QUOTING: "Quoting",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  CONTRACTOR_DONE: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const getStatusBadgeVariant = (status: ReportingStatus) => {
  switch (status) {
    case "COMPLETED": return "default";
    case "CONTRACTOR_DONE":
    case "ASSIGNED":
    case "IN_PROGRESS": return "secondary";
    case "QUOTING": return "destructive";
    default: return "outline";
  }
};

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
  });

interface JobType {
  id: string;
  jobType: string;
  location?: string;
  description: string;
  dueDate: string;
  startDate?: string;
  endDate?: string;
  dateDone?: string;
  priority?: string;
  status: ReportingStatus;
  createdAt?: string;
  totalCharged?: number | null;
  totalCost?: number | null;
  contractorId?: string;
  media?: string[];
  invoice?: string | null;
  property?: { addressLine1?: string; addressLine2?: string; town?: string; postCode?: string };
}

const reportSchema = z.object({
  jobType: z.string().min(1, "Type is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.string().optional(),
  media: z.array(z.string()).min(1, "At least one photo is required"),
});
type ReportFormData = z.infer<typeof reportSchema>;

const formatAddress = (property?: JobType["property"]) => {
  if (!property) return "-";
  return [property.addressLine1, property.addressLine2, property.town, property.postCode].filter(Boolean).join(", ");
};

const contractorUpdateSchema = z
  .object({
    description: z.string().min(1, "Description is required"),
    totalCost: z.coerce.number().min(0).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    media: z.array(z.string()).optional(),
    invoice: z.string().optional(),
  })
  .refine((data) => !data.endDate || data.startDate, {
    message: "Set a start date before an end date",
    path: ["endDate"],
  });
type ContractorUpdateFormData = z.infer<typeof contractorUpdateSchema>;

const ContractorUpdateDialog = ({ job, onUpdated }: { job: JobType; onUpdated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContractorUpdateFormData>({
    resolver: zodResolver(contractorUpdateSchema),
    defaultValues: {
      description: job.description,
      totalCost: job.totalCost ?? undefined,
      startDate: job.startDate || "",
      endDate: job.endDate || "",
      media: job.media || [],
      invoice: job.invoice || "",
    },
  });

  const submit = async (data: ContractorUpdateFormData, markDone: boolean) => {
    if (data.endDate && data.endDate > job.dueDate) {
      toast.error("End date cannot be after the job's due date");
      return;
    }
    setIsSaving(true);
    try {
      const payload: Record<string, any> = { description: data.description };
      if (data.totalCost !== undefined) payload.totalCost = data.totalCost;
      if (data.startDate && data.startDate !== job.startDate) payload.startDate = data.startDate;
      if (data.endDate && data.endDate !== job.endDate) payload.endDate = data.endDate;
      if (data.media && data.media.length > 0) payload.media = data.media;
      if (data.invoice) payload.invoice = data.invoice;
      if (markDone) payload.status = "CONTRACTOR_DONE";

      await partyPost("contractor", `property-management/job-type/${job.id}`, payload);
      toast.success(markDone ? "Job marked as done — pending office review" : "Job updated");
      setOpen(false);
      onUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update job");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Wrench className="h-4 w-4 mr-2" /> Update
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update job</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Work details</p>
            <div className="space-y-2">
              <Label htmlFor="description">{renderLabel("Description *")}</Label>
              <Textarea id="description" rows={4} {...register("description")} placeholder="Describe what was found and what work was done..." />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-3">Schedule</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date</Label>
                <Input id="endDate" type="date" max={job.dueDate} disabled={!watch("startDate")} {...register("endDate")} />
                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-3">Cost</p>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="totalCost">Your cost (£)</Label>
              <Input id="totalCost" type="number" step="0.01" {...register("totalCost")} />
              {errors.totalCost && <p className="text-sm text-destructive">{errors.totalCost.message}</p>}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-3">Attachments</p>
            <FileUploadField
              label="Photos"
              name="media"
              accept="image/jpeg,image/png,image/webp"
              multiple
              register={register}
              setValue={setValue}
              watch={watch}
              error={errors.media?.message as string | undefined}
            />
            <FileUploadField
              label="Invoice"
              name="invoice"
              accept="image/*,.pdf"
              multiple={false}
              register={register}
              setValue={setValue}
              watch={watch}
              error={errors.invoice?.message as string | undefined}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t mt-2">
          <Button type="button" variant="outline" disabled={isSaving} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" disabled={isSaving} onClick={handleSubmit((d) => submit(d, false))}>
            Save progress
          </Button>
          <Button type="button" disabled={isSaving} onClick={handleSubmit((d) => submit(d, true))}>
            Mark Job Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PartyMaintenance = ({ kind }: { kind: PartyKind }) => {
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [landlordName, setLandlordName] = useState<string>("");
  const canCreate = kind === "vendor" || kind === "tenant";

  useEffect(() => {
    if (kind === "vendor") {
      getPartyInfo(kind).then((party) => {
        setLandlordName([party?.firstName, party?.lastName].filter(Boolean).join(" "));
      });
    }
  }, [kind]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportFormData>({ resolver: zodResolver(reportSchema) });

  const [reportPictures, setReportPictures] = useState<File[]>([]);

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
    if (reportPictures.length === 0) {
      toast.error("At least one photo is required to report an issue");
      return;
    }
    try {
      const media = await Promise.all(reportPictures.map(readAsDataUrl));
      await partyPost(kind, "property-management/job-type", { ...data, media, propertyId });
      toast.success("Maintenance request submitted");
      reset();
      setReportPictures([]);
      setIsDialogOpen(false);
      loadJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    }
  };

  return (
    <PartyDashboardLayout kind={kind}>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="jobType">{renderLabel("Type *")}</Label>
                        <Select onValueChange={(v) => setValue("jobType", v, { shouldValidate: true })} value={watch("jobType")}>
                          <SelectTrigger id="jobType">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {JOB_TYPE_OPTIONS.map((o) => (
                              <SelectItem key={o} value={o}>{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.jobType && <p className="text-sm text-destructive">{errors.jobType.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">{renderLabel("Location *")}</Label>
                        <Select onValueChange={(v) => setValue("location", v, { shouldValidate: true })} value={watch("location")}>
                          <SelectTrigger id="location">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {JOB_LOCATION_OPTIONS.map((o) => (
                              <SelectItem key={o} value={o}>{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">{renderLabel("Description *")}</Label>
                      <Textarea id="description" {...register("description")} placeholder="Describe the issue..." />
                      {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">{renderLabel("Preferred date *")}</Label>
                      <Input id="dueDate" type="date" {...register("dueDate")} />
                      {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reportPictures">{renderLabel("Photos *")}</Label>
                      <Input
                        id="reportPictures"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setReportPictures(Array.from(e.target.files || []))}
                      />
                      <p className="text-xs text-muted-foreground">At least one photo is required.</p>
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
                <div key={job.id} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">
                      {job.jobType}
                      {job.location && <span className="text-muted-foreground font-normal"> · {job.location}</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">{job.description}</div>
                    {kind === "contractor" && (
                      <div className="text-xs text-muted-foreground mt-1">{formatAddress(job.property)}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">Due: {job.dueDate}</div>
                    {(job.startDate || job.endDate) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {job.startDate && <>Started: {job.startDate} </>}
                        {job.endDate && <>· Ended: {job.endDate}</>}
                      </div>
                    )}
                    {kind === "vendor" && job.totalCharged != null && (
                      <div className="text-xs font-medium mt-1">Cost: £{job.totalCharged}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={getStatusBadgeVariant(job.status)}>{STATUS_LABELS[job.status] ?? job.status}</Badge>
                    {job.priority && <Badge variant="outline">{job.priority}</Badge>}
                    {kind === "contractor" && job.status !== "COMPLETED" && job.status !== "CANCELLED" && (
                      <ContractorUpdateDialog job={job} onUpdated={loadJobs} />
                    )}
                    {kind === "vendor" && job.status === "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={job.totalCharged == null}
                        title={job.totalCharged == null ? "No charge has been recorded for this job yet" : undefined}
                        onClick={() =>
                          generateMaintenanceInvoicePdf({
                            jobId: job.id,
                            jobType: job.jobType,
                            description: job.description,
                            dueDate: job.dueDate,
                            dateDone: job.dateDone,
                            totalCharged: job.totalCharged,
                            addressLine1: job.property?.addressLine1,
                            addressLine2: job.property?.addressLine2,
                            town: job.property?.town,
                            postCode: job.property?.postCode,
                            landlordName,
                          })
                        }
                      >
                        <Download className="h-4 w-4 mr-2" /> Invoice
                      </Button>
                    )}
                  </div>
                </div>
                {job.media && job.media.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Photos from the job</div>
                    <div className="flex flex-wrap gap-2">
                      {job.media.map((src, i) =>
                        src.startsWith("data:application/pdf") ? (
                          <embed key={i} src={src} type="application/pdf" className="w-20 h-20 rounded-md border" />
                        ) : (
                          <img
                            key={i}
                            src={src}
                            alt={`Job photo ${i + 1}`}
                            className="w-20 h-20 object-cover rounded-md border cursor-pointer"
                            onClick={() => window.open(src, "_blank")}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PartyDashboardLayout>
  );
};

export default PartyMaintenance;
