import { useState, useEffect } from "react";
import StoredFilePreview from "@/components/StoredFilePreview";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { priorityBadgeClass } from "@/utils/priorityStyle";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ChevronLeft, Phone, Mail } from "lucide-react";
import InputField from "@/utils/InputField";
import TextAreaField from "@/utils/TextAreaField";
import SelectField from "@/utils/SelectedField";
import { DateField } from "@/utils/DateField";
import ContractorPicker from "@/utils/ContractorPicker";
import FileUploadField from "@/utils/FileUploadField";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchJobTypeById, updateJobType, JobType, ReportingStatus } from "@/redux/dataStore/jobTypeSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Department } from "@/types/permissions";
import { formatLocalDate } from "@/helper/formatLocalDate";
import { get, post } from "@/helper/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { buildMaintenanceInvoice, downloadMaintenanceInvoice, invoiceToBase64, invoiceRef } from "@/utils/maintenanceInvoice";
import { InfoHint } from "@/components/ui/hint";
import { JOB_TYPE_OPTIONS, JOB_LOCATION_OPTIONS } from "@/helper/jobTypeOptions";

interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  actorKind: string;
  actorName?: string;
  createdAt: string;
}

const editSchema = z.object({
  jobType: z.string().min(1, "Type is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
  dueDate: z
    .string()
    .min(1, "Due date is required")
    .refine((value) => value > formatLocalDate(new Date()), { message: "Due date must be after today" }),
  schedule: z.string().optional(),
  time: z.string().optional(),
  thingsToDo: z.string().optional(),
  priority: z.string().optional(),
  mediaFileIds: z.array(z.string()).optional(),
});

type EditFormData = z.infer<typeof editSchema>;

const STATUS_LABELS: Record<ReportingStatus, string> = {
  QUOTING: "Quoting",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  CONTRACTOR_DONE: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_OPTIONS: ReportingStatus[] = ["QUOTING", "ASSIGNED", "IN_PROGRESS", "CONTRACTOR_DONE", "COMPLETED", "CANCELLED"];

const getStatusBadgeVariant = (status: ReportingStatus) => {
  switch (status) {
    case "COMPLETED": return "default";
    case "CONTRACTOR_DONE":
    case "ASSIGNED":
    case "IN_PROGRESS": return "secondary";
    case "QUOTING": return "destructive";
    case "CANCELLED": return "outline";
    default: return "outline";
  }
};

const formatAddress = (property?: JobType["property"]) => {
  if (!property) return "-";
  return [property.addressLine1, property.addressLine2, property.town, property.postCode]
    .filter(Boolean)
    .join(", ");
};

const MaintenanceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { jobTypes, loading } = useAppSelector((state) => state.jobTypes);
  const job = jobTypes.find((j) => j.id === id) || null;
  const { isDepartmentAdmin } = useAuth();
  const canManageMaintenance = isDepartmentAdmin(Department.Maintenance);

  const [isEditing, setIsEditing] = useState(false);
  const [marginType, setMarginType] = useState<"percent" | "amount">("percent");
  const [marginValue, setMarginValue] = useState("");
  const [isSavingMargin, setIsSavingMargin] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pendingContractorId, setPendingContractorId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  // Landlord email: nothing is sent automatically — staff press the send button.
  const [isEmailingLandlord, setIsEmailingLandlord] = useState(false);
  const [invoicePrompt, setInvoicePrompt] = useState<{ base64: string } | null>(null);
  const [isSavingDeductible, setIsSavingDeductible] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchJobTypeById(id));
  }, [dispatch, id]);

  const loadHistory = async () => {
    if (!id || history !== null) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await get<{ history: HistoryEntry[] }>(`property-management/job-type/${id}/history`);
      if (error) throw new Error(error.message);
      setHistory(data?.history || []);
    } catch (error) {
      toast.error("Failed to load job history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (job) {
      reset({
        jobType: job.jobType,
        location: job.location || "",
        description: job.description,
        dueDate: job.dueDate,
        schedule: job.schedule || "",
        time: job.time || "",
        thingsToDo: job.thingsToDo || "",
        priority: job.priority || "",
        mediaFileIds: job.mediaFileIds || [],
      });
      setPendingContractorId(job.contractorId || "");
    }
  }, [job, reset]);

  // Once a contractor is assigned, reassigning is locked until the job is
  // awaiting review/completed, or its due date has passed — mirrors the
  // backend rule in job-type-note.service.ts exactly.
  const isJobOverdue = !!job && job.status !== "COMPLETED" && job.status !== "CANCELLED" && job.dueDate < formatLocalDate(new Date());
  const isAwaitingReviewOrDone = job?.status === "CONTRACTOR_DONE" || job?.status === "COMPLETED";
  const canReassignContractor = !job?.contractorId || isAwaitingReviewOrDone || isJobOverdue;
  // COMPLETED/CANCELLED are terminal — mirrors the backend's hard lock in
  // updateJobType, which now rejects any edit to a closed job outright.
  const isJobClosed = job?.status === "COMPLETED" || job?.status === "CANCELLED";

  const landlord = job?.property?.vendor;
  const landlordName = landlord ? [landlord.firstName, landlord.lastName].filter(Boolean).join(" ") || "Landlord" : "";

  const sendLandlordEmail = async (invoicePdfBase64?: string) => {
    if (!job?.id) return false;
    setIsEmailingLandlord(true);
    try {
      const { data, error }: any = await post(`property-management/job-type/${job.id}/email-landlord`, invoicePdfBase64 ? { invoicePdfBase64 } : {});
      if (error) throw new Error(error.message);
      toast.success(data?.message || "Email sent to landlord");
      setHistory(null); // refresh history next time it's opened
      return true;
    } catch (error: any) {
      toast.error(error?.message || "Failed to email landlord");
      return false;
    } finally {
      setIsEmailingLandlord(false);
    }
  };

  const handleGenerateInvoice = () => {
    if (!job) return;
    const doc = buildMaintenanceInvoice(job);
    downloadMaintenanceInvoice(doc, job);
    // After generating, ask whether to send it to the landlord.
    if (landlord?.email && canManageMaintenance) setInvoicePrompt({ base64: invoiceToBase64(doc) });
  };

  const handleTogglePortal = async (showOnLandlordPortal: boolean) => {
    if (!job?.id) return;
    setIsSavingDeductible(true);
    try {
      await dispatch(updateJobType({ id: job.id, jobTypeData: { propertyId: job.propertyId, showOnLandlordPortal } as any })).unwrap();
      await dispatch(fetchJobTypeById(job.id));
      toast.success(showOnLandlordPortal ? "Now shown on the landlord portal" : "Hidden from the landlord portal");
    } catch (error: any) {
      toast.error(typeof error === "string" ? error : error?.message || "Failed to update");
    } finally {
      setIsSavingDeductible(false);
    }
  };

  const handleToggleDeductible = async (deductible: boolean) => {
    if (!job?.id) return;
    setIsSavingDeductible(true);
    try {
      await dispatch(updateJobType({ id: job.id, jobTypeData: { propertyId: job.propertyId, deductible } as any })).unwrap();
      await dispatch(fetchJobTypeById(job.id));
      toast.success(deductible ? "Marked as deductible from landlord" : "Marked as not deductible — hidden from landlord transactions");
    } catch (error: any) {
      toast.error(typeof error === "string" ? error : error?.message || "Failed to update");
    } finally {
      setIsSavingDeductible(false);
    }
  };

  const handleAssignContractor = async () => {
    if (!job?.id || !pendingContractorId) return;
    setIsAssigning(true);
    try {
      await dispatch(updateJobType({ id: job.id, jobTypeData: { propertyId: job.propertyId, contractorId: pendingContractorId } })).unwrap();
      await dispatch(fetchJobTypeById(job.id));
      toast.success("Contractor assigned");
    } catch (error: any) {
      toast.error(typeof error === "string" ? error : error?.message || "Failed to assign contractor");
    } finally {
      setIsAssigning(false);
    }
  };

  const onSubmit = async (data: EditFormData) => {
    if (!job?.id) return;
    try {
      // .unwrap() is required — createAsyncThunk never throws on its own,
      // so without it a rejected update (e.g. the backend's closed-job
      // lock) was silently treated as success here.
      await dispatch(
        updateJobType({
          id: job.id,
          jobTypeData: {
            propertyId: job.propertyId,
            jobType: data.jobType,
            location: data.location,
            description: data.description,
            dueDate: data.dueDate,
            thingsToDo: data.thingsToDo,
            priority: data.priority,
            mediaFileIds: data.mediaFileIds,
          },
        })
      ).unwrap();
      await dispatch(fetchJobTypeById(job.id));
      toast.success("Maintenance job updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(typeof error === "string" ? error : error?.message || "Error updating maintenance job");
    }
  };

  const handleCompleteJob = async () => {
    if (!job?.id) return;
    try {
      await dispatch(
        updateJobType({
          id: job.id,
          jobTypeData: { propertyId: job.propertyId, dateDone: formatLocalDate(new Date()), status: "COMPLETED" },
        })
      ).unwrap();
      await dispatch(fetchJobTypeById(job.id));
      toast.success("Maintenance job marked as done");
    } catch (error: any) {
      toast.error(typeof error === "string" ? error : error?.message || "Error completing maintenance job");
    }
  };

  const handleApplyMargin = async () => {
    if (!job?.id) return;
    const value = Number(marginValue);
    if (!marginValue || isNaN(value) || value < 0) {
      toast.error("Enter a valid margin value");
      return;
    }
    setIsSavingMargin(true);
    try {
      await dispatch(
        updateJobType({
          id: job.id,
          jobTypeData: {
            propertyId: job.propertyId,
            ...(marginType === "percent" ? { marginPercent: value } : { marginAmount: value }),
          },
        })
      ).unwrap();
      await dispatch(fetchJobTypeById(job.id));
      toast.success("Landlord cost updated");
      setMarginValue("");
    } catch (error: any) {
      toast.error(typeof error === "string" ? error : error?.message || "Failed to apply margin");
    } finally {
      setIsSavingMargin(false);
    }
  };

  const handleCancelJob = async () => {
    if (!job?.id) return;
    try {
      await dispatch(
        updateJobType({ id: job.id, jobTypeData: { propertyId: job.propertyId, status: "CANCELLED" } })
      ).unwrap();
      await dispatch(fetchJobTypeById(job.id));
      toast.success("Maintenance job cancelled");
    } catch (error: any) {
      toast.error(typeof error === "string" ? error : error?.message || "Error cancelling maintenance job");
    }
  };

  if (loading && !job) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-muted-foreground">Loading maintenance job...</div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-muted-foreground">Maintenance job not found</div>
      </DashboardLayout>
    );
  }

  const vendor = job.property?.vendor;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate("/maintenance")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="text-sm text-muted-foreground">
            <Link to="/maintenance" className="hover:underline">Maintenance</Link>
            {" > "}
            {formatAddress(job.property)}
          </div>
        </div>

        <Tabs defaultValue="details" onValueChange={(v) => v === "history" && loadHistory()}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            {canManageMaintenance && <TabsTrigger value="history">History</TabsTrigger>}
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <Card className="p-4">
              <div className="font-semibold mb-3">Cost breakdown</div>
              {job.totalCost == null ? (
                <p className="text-sm text-muted-foreground">Waiting on the contractor to enter their cost.</p>
              ) : (
                <div className="text-sm">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5 text-muted-foreground">Contractor cost</td>
                        <td className="py-1.5 text-right font-medium">£{job.totalCost.toFixed(2)}</td>
                      </tr>
                      {job.marginPercent != null && (
                        <tr className="border-b">
                          <td className="py-1.5 text-muted-foreground">
                            Markup ({job.marginPercent}% of £{job.totalCost.toFixed(2)})
                          </td>
                          <td className="py-1.5 text-right font-medium">
                            + £{(job.totalCost * (job.marginPercent / 100)).toFixed(2)}
                          </td>
                        </tr>
                      )}
                      {job.marginAmount != null && (
                        <tr className="border-b">
                          <td className="py-1.5 text-muted-foreground">Markup (flat amount)</td>
                          <td className="py-1.5 text-right font-medium">+ £{job.marginAmount.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-1.5 font-semibold">Landlord cost</td>
                        <td className="py-1.5 text-right font-semibold">
                          {job.totalCharged != null ? `£${job.totalCharged.toFixed(2)}` : "Not set yet"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {canManageMaintenance && (
              <Card className="p-4">
                <div className="font-semibold mb-3">Set landlord markup</div>
                {isJobClosed ? (
                  <p className="text-sm text-muted-foreground">
                    This job is {job.status === "COMPLETED" ? "completed" : "cancelled"} and can no longer be edited.
                  </p>
                ) : job.totalCost == null ? (
                  <p className="text-sm text-muted-foreground">
                    Waiting on the contractor to enter their cost before a markup can be applied.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={marginType === "percent" ? "default" : "outline"}
                        onClick={() => setMarginType("percent")}
                      >
                        Percentage
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={marginType === "amount" ? "default" : "outline"}
                        onClick={() => setMarginType("amount")}
                      >
                        Flat amount
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 max-w-xs">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        placeholder={marginType === "percent" ? "e.g. 20 (%)" : "e.g. 15.00 (£)"}
                        value={marginValue}
                        onChange={(e) => setMarginValue(e.target.value)}
                      />
                      <Button type="button" size="sm" disabled={isSavingMargin} onClick={handleApplyMargin}>
                        Apply
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only one of percentage or flat amount can be active — applying one clears the other.
                    </p>
                  </div>
                )}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card className="p-4 space-y-4">
              <div>
                <div className="font-semibold">Landlord invoice</div>
                <p className="text-sm text-muted-foreground">
                  {job.totalCharged != null || job.totalCost != null
                    ? `Amount: £${Number(job.totalCharged ?? job.totalCost).toFixed(2)}`
                    : "No cost has been entered for this job yet."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" disabled={job.totalCharged == null && job.totalCost == null} onClick={handleGenerateInvoice}>
                  Generate invoice
                </Button>
              </div>

              {canManageMaintenance && (
                <div className="border-t pt-4 space-y-3">
                  <label className="flex items-start gap-3">
                    <Checkbox
                      checked={job.showOnLandlordPortal !== false}
                      disabled={isSavingDeductible}
                      onCheckedChange={(v) => handleTogglePortal(v === true)}
                    />
                    <span>
                      <span className="font-semibold block">Show on landlord portal<InfoHint text="When ticked, the landlord can see this job (and its invoice) when they log in to their portal. Untick to keep it internal." /></span>
                      <span className="text-sm text-muted-foreground">
                        {job.showOnLandlordPortal !== false
                          ? "The landlord can see this job in their portal."
                          : "Hidden — the landlord can't see this job in their portal."}
                      </span>
                    </span>
                  </label>
                  <div className="font-semibold">Email landlord<InfoHint text="Sends the landlord the job details and invoice by email. Use it again after changes to send them an updated copy." /></div>
                  {landlord?.email ? (
                    <>
                      <p className="text-sm">
                        Send to <span className="font-medium">{landlordName}</span>{" "}
                        <span className="text-muted-foreground">({landlord.email})</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isEmailingLandlord}
                          onClick={() => void sendLandlordEmail()}
                        >
                          <Mail className="h-4 w-4 mr-2" /> {isEmailingLandlord ? "Sending…" : "Send / update email to landlord"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isEmailingLandlord || (job.totalCharged == null && job.totalCost == null)}
                          onClick={() => void sendLandlordEmail(invoiceToBase64(buildMaintenanceInvoice(job)))}
                        >
                          <Mail className="h-4 w-4 mr-2" /> Send invoice to landlord
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">The landlord is never emailed automatically.</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">This property's landlord has no email on file.</p>
                  )}
                </div>
              )}
            </Card>

            <Dialog open={!!invoicePrompt} onOpenChange={(open) => !open && setInvoicePrompt(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send invoice to landlord?</DialogTitle>
                </DialogHeader>
                <p className="text-sm">
                  Invoice {invoiceRef(job)} has been downloaded. Do you want to email it to{" "}
                  <span className="font-medium">{landlordName}</span>{" "}
                  <span className="text-muted-foreground">({landlord?.email})</span>?
                </p>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setInvoicePrompt(null)} disabled={isEmailingLandlord}>
                    No, don't send
                  </Button>
                  <Button
                    type="button"
                    disabled={isEmailingLandlord}
                    onClick={async () => {
                      if (invoicePrompt && (await sendLandlordEmail(invoicePrompt.base64))) setInvoicePrompt(null);
                    }}
                  >
                    {isEmailingLandlord ? "Sending…" : "Yes, send to landlord"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card className="p-4">
              <div className="font-semibold mb-3">Contractor invoice</div>
              {job.invoiceFileId ? (
                <StoredFilePreview fileId={job.invoiceFileId} alt="Contractor invoice" className="w-full h-96 rounded-md border object-contain" />
              ) : (
                <p className="text-sm text-muted-foreground">No invoice has been uploaded by the contractor yet.</p>
              )}
            </Card>
          </TabsContent>

          {canManageMaintenance && (
            <TabsContent value="history" className="space-y-4">
              <Card className="p-4">
                <div className="font-semibold mb-3">Job history</div>
                {historyLoading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
                ) : !history || history.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No history recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="border-l-2 border-border pl-3 py-0.5">
                        <div className="text-sm">{entry.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.actorName ? `${entry.actorName} (${entry.actorKind})` : entry.actorKind} —{" "}
                          {new Date(entry.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          )}

          <TabsContent value="details" className="space-y-6">
            <Card className="p-4">
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={job.deductible !== false}
                  disabled={!canManageMaintenance || isSavingDeductible}
                  onCheckedChange={(v) => handleToggleDeductible(v === true)}
                />
                <span>
                  <span className="font-semibold block">Deductible from landlord<InfoHint text="Ticked: the cost of this job can be charged back to the landlord on their payment transaction. Unticked: Woodland absorbs it and it never appears on the landlord's transactions." /></span>
                  <span className="text-sm text-muted-foreground">
                    {job.deductible !== false
                      ? "This job's cost can be recharged on the landlord's transactions."
                      : "Not deductible — this job won't appear in the landlord's transactions."}
                  </span>
                </span>
              </label>
            </Card>

        {isEditing ? (
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <SelectField
                  label="Type *"
                  name="jobType"
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  error={errors.jobType?.message}
                  options={JOB_TYPE_OPTIONS.map((o) => ({ value: o, label: o }))}
                />
                <SelectField
                  label="Location *"
                  name="location"
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  error={errors.location?.message}
                  options={JOB_LOCATION_OPTIONS.map((o) => ({ value: o, label: o }))}
                />
                <SelectField
                  label="Priority"
                  name="priority"
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  error={errors.priority?.message}
                  options={[
                    { value: "Low", label: "Low" },
                    { value: "Medium", label: "Medium" },
                    { value: "Critical", label: "Critical" },
                  ]}
                />
              </div>

              <TextAreaField label="Description" name="description" register={register} error={errors.description?.message} />

              <div className="grid grid-cols-3 gap-4">
                <DateField label="Due Date *" value={watch("dueDate") || ""} onChange={(date) => setValue("dueDate", formatLocalDate(date))} error={errors.dueDate?.message} />
              </div>

              <TextAreaField label="Things To Do" name="thingsToDo" register={register} error={errors.thingsToDo?.message} />

              <FileUploadField
                label="Photos"
                name="mediaFileIds"
                upload={{ category: "job-media", entityType: "jobType", entityId: job.id, propertyId: job.propertyId }}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                register={register}
                setValue={setValue}
                watch={watch}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="font-semibold mb-3">Contractor details</div>
                {job.contractorRef ? (
                  <div className="space-y-1 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {job.contractorRef.name}</div>
                    {job.contractorRef.company && <div><span className="text-muted-foreground">Company:</span> {job.contractorRef.company}</div>}
                    {job.contractorRef.phone && (
                      <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {job.contractorRef.phone}</div>
                    )}
                    {job.contractorRef.email && (
                      <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {job.contractorRef.email}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No contractor assigned yet.</p>
                )}
              </Card>

              <Card className="p-4">
                <div className="font-semibold mb-3">Landlord details</div>
                {vendor ? (
                  <div className="space-y-1 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {vendor.firstName} {vendor.lastName}</div>
                    {vendor.phone && (
                      <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {vendor.phone}</div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {vendor.email}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No landlord linked to this property.</p>
                )}
              </Card>
            </div>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Job details</div>
                {!isJobClosed && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                )}
              </div>
              <div className="flex gap-2 mb-3">
                {job.priority && <Badge variant="outline" className={priorityBadgeClass(job.priority)}>Priority: {job.priority}</Badge>}
                <Badge variant={getStatusBadgeVariant(job.status)}>Status: {STATUS_LABELS[job.status] ?? job.status}</Badge>
                {isJobOverdue && <Badge variant="destructive">Overdue</Badge>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div><span className="text-muted-foreground">Type:</span> {job.jobType}</div>
                <div><span className="text-muted-foreground">Location:</span> {job.location || "-"}</div>
                <div className="md:col-span-2"><span className="text-muted-foreground">Description:</span> {job.description}</div>
                {job.thingsToDo && <div className="md:col-span-2"><span className="text-muted-foreground">Notes:</span> {job.thingsToDo}</div>}
                <div><span className="text-muted-foreground">Due date:</span> {job.dueDate}</div>
                {job.startDate && <div><span className="text-muted-foreground">Start date (set by contractor):</span> {job.startDate}</div>}
                {job.endDate && <div><span className="text-muted-foreground">End date (set by contractor):</span> {job.endDate}</div>}
                {job.dateDone && <div><span className="text-muted-foreground">Done:</span> {job.dateDone}</div>}
              </div>

              {/* Next-step hint row — read only, no edit needed to see what's pending */}
              <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                {job.status === "QUOTING" && "Next step: assign a contractor."}
                {job.status === "ASSIGNED" && "Next step: waiting on the contractor to set a start date."}
                {job.status === "IN_PROGRESS" && "Next step: waiting on the contractor to submit as done."}
                {job.status === "CONTRACTOR_DONE" && "Next step: review the contractor's cost, set a markup, and complete the job."}
                {job.status === "COMPLETED" && "This job is complete."}
                {job.status === "CANCELLED" && "This job was cancelled."}
              </div>
            </Card>

            {canManageMaintenance && (
              <Card className="p-4">
                <div className="font-semibold mb-3">Assign contractor</div>
                {isJobClosed ? (
                  <p className="text-sm text-muted-foreground">
                    This job is {job.status === "COMPLETED" ? "completed" : "cancelled"} and can no longer be edited.
                  </p>
                ) : !canReassignContractor ? (
                  <p className="text-sm text-muted-foreground">
                    A contractor is already assigned. Reassignment is disabled until the job is submitted as done or its due date passes.
                  </p>
                ) : (
                  <div className="flex items-end gap-2">
                    <div className="flex-1 max-w-sm">
                      <ContractorPicker
                        label="Contractor"
                        name="_pendingContractorId"
                        watch={() => pendingContractorId}
                        setValue={(_name: string, value: string) => setPendingContractorId(value)}
                        clearErrors={() => undefined}
                      />
                    </div>
                    <Button disabled={isAssigning || !pendingContractorId} onClick={handleAssignContractor}>
                      {job.contractorId ? "Reassign" : "Assign"}
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {canManageMaintenance && (
              <div className="flex justify-end gap-2">
                {job.status !== "CANCELLED" && job.status !== "COMPLETED" && (
                  <Button variant="outline" onClick={handleCancelJob}>Cancel Job</Button>
                )}
                {job.status === "CONTRACTOR_DONE" && (
                  <Button onClick={handleCompleteJob}>Complete Job</Button>
                )}
              </div>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-3">Attached media</div>
                {job.mediaFileIds && job.mediaFileIds.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {job.mediaFileIds.map((fileId, index) => (
                      <div key={fileId} className="relative group">
                        <StoredFilePreview fileId={fileId} alt={`Attachment ${index + 1}`} className="object-cover rounded-md shadow-sm w-full h-32" clickToOpen />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No media attached. Use Edit to attach files.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MaintenanceDetail;
