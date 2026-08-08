import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const editSchema = z.object({
  jobType: z.string().min(1, "Type is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  schedule: z.string().optional(),
  time: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  thingsToDo: z.string().optional(),
  priority: z.string().optional(),
  contractorId: z.string().optional(),
  status: z.string().optional(),
  dateDone: z.string().optional(),
  media: z.array(z.string()).optional(),
  totalCost: z.coerce.number().optional(),
  totalCharged: z.coerce.number().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

const STATUS_LABELS: Record<ReportingStatus, string> = {
  QUOTING: "Quoting",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_OPTIONS: ReportingStatus[] = ["QUOTING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const getStatusBadgeVariant = (status: ReportingStatus) => {
  switch (status) {
    case "COMPLETED": return "default";
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

  useEffect(() => {
    if (id) dispatch(fetchJobTypeById(id));
  }, [dispatch, id]);

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
        description: job.description,
        dueDate: job.dueDate,
        schedule: job.schedule || "",
        time: job.time || "",
        startDate: job.startDate || "",
        endDate: job.endDate || "",
        thingsToDo: job.thingsToDo || "",
        priority: job.priority || "",
        contractorId: job.contractorId || "",
        status: job.status,
        dateDone: job.dateDone || "",
        media: job.media || [],
        totalCost: job.totalCost,
        totalCharged: job.totalCharged,
      });
    }
  }, [job, reset]);

  const handleDateChange = (field: keyof EditFormData, date: Date) => {
    setValue(field, date.toISOString().split("T")[0]);
  };

  const watchedContractorId = watch("contractorId");
  const watchedStartDate = watch("startDate");
  const canSetStartDate = !!watchedContractorId;
  const canSetEndDate = !!watchedStartDate;

  const onSubmit = async (data: EditFormData) => {
    if (!job?.id) return;
    try {
      await dispatch(
        updateJobType({
          id: job.id,
          jobTypeData: {
            propertyId: job.propertyId,
            jobType: data.jobType,
            description: data.description,
            dueDate: data.dueDate,
            schedule: data.schedule,
            time: data.time,
            startDate: data.startDate,
            endDate: data.endDate,
            thingsToDo: data.thingsToDo,
            priority: data.priority,
            media: data.media,
            totalCost: data.totalCost,
            totalCharged: data.totalCharged,
            // Contractor assignment and status changes are Maintenance
            // Department Admin only — the backend rejects these fields from
            // anyone else, so omit them entirely rather than send-and-fail.
            ...(canManageMaintenance
              ? { contractorId: data.contractorId, status: data.status as ReportingStatus, dateDone: data.dateDone }
              : {}),
          },
        })
      );
      await dispatch(fetchJobTypeById(job.id));
      toast.success("Maintenance job updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Error updating maintenance job");
    }
  };

  const handleCompleteJob = async () => {
    if (!job?.id) return;
    try {
      await dispatch(
        updateJobType({
          id: job.id,
          jobTypeData: { propertyId: job.propertyId, dateDone: new Date().toISOString().split("T")[0], status: "COMPLETED" },
        })
      );
      await dispatch(fetchJobTypeById(job.id));
      toast.success("Maintenance job marked as done");
    } catch (error) {
      toast.error("Error completing maintenance job");
    }
  };

  const handleCancelJob = async () => {
    if (!job?.id) return;
    try {
      await dispatch(
        updateJobType({ id: job.id, jobTypeData: { propertyId: job.propertyId, status: "CANCELLED" } })
      );
      await dispatch(fetchJobTypeById(job.id));
      toast.success("Maintenance job cancelled");
    } catch (error) {
      toast.error("Error cancelling maintenance job");
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

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payments" disabled>Payments</TabsTrigger>
            <TabsTrigger value="invoices" disabled>Invoices</TabsTrigger>
          </TabsList>
          <TabsContent value="payments">
            <p className="text-sm text-muted-foreground py-8 text-center">Payments tracking is coming soon.</p>
          </TabsContent>
          <TabsContent value="invoices">
            <p className="text-sm text-muted-foreground py-8 text-center">Invoices tracking is coming soon.</p>
          </TabsContent>
          <TabsContent value="details" className="space-y-6">

        {isEditing ? (
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Type" name="jobType" register={register} setValue={setValue} error={errors.jobType?.message} />
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
                <DateField label="Due Date" value={watch("dueDate") || ""} onChange={(date) => handleDateChange("dueDate", date)} error={errors.dueDate?.message} />
                <InputField label="Schedule" name="schedule" register={register} setValue={setValue} error={errors.schedule?.message} />
                <InputField label="Arrival Time" name="time" register={register} setValue={setValue} error={errors.time?.message} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DateField
                  label="Start Date"
                  value={watch("startDate") || ""}
                  onChange={(date) => handleDateChange("startDate", date)}
                  error={errors.startDate?.message}
                  disabled={!canSetStartDate}
                  placeholder={canSetStartDate ? "Pick a date" : "Assign a contractor first"}
                />
                <DateField
                  label="End Date"
                  value={watch("endDate") || ""}
                  onChange={(date) => handleDateChange("endDate", date)}
                  error={errors.endDate?.message}
                  disabled={!canSetEndDate}
                  placeholder={canSetEndDate ? "Pick a date" : "Set a start date first"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Total Cost" name="totalCost" type="number" register={register} setValue={setValue} error={errors.totalCost?.message} placeholder="What the contractor charges" />
                <InputField label="Total Charged (to landlord)" name="totalCharged" type="number" register={register} setValue={setValue} error={errors.totalCharged?.message} placeholder="What is charged to the landlord" />
              </div>

              {canManageMaintenance ? (
                <>
                  <ContractorPicker
                    label="Contractor"
                    name="contractorId"
                    watch={watch}
                    setValue={setValue}
                    clearErrors={clearErrors as (name: string) => void}
                    error={errors.contractorId?.message}
                  />

                  <SelectField
                    label="Reporting Status"
                    name="status"
                    register={register}
                    setValue={setValue}
                    watch={watch}
                    error={errors.status?.message}
                    options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
                  />
                </>
              ) : (
                <div className="text-sm">
                  <span className="text-muted-foreground">Contractor:</span>{" "}
                  {job.contractorRef ? job.contractorRef.name : "Not assigned yet"}
                  <span className="text-muted-foreground ml-1">(only Maintenance Department Admin can assign)</span>
                </div>
              )}

              <TextAreaField label="Things To Do" name="thingsToDo" register={register} error={errors.thingsToDo?.message} />

              {canManageMaintenance && (
                <DateField label="Date Completed" value={watch("dateDone") || ""} onChange={(date) => handleDateChange("dateDone", date)} error={errors.dateDone?.message} />
              )}

              <FileUploadField
                label="Attach media to the job"
                name="media"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">Job details</div>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                </div>
                <div className="flex gap-2 mb-2">
                  {job.priority && <Badge variant="outline">Priority: {job.priority}</Badge>}
                  <Badge variant={getStatusBadgeVariant(job.status)}>Status: {STATUS_LABELS[job.status] ?? job.status}</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Description:</span> {job.description}</div>
                  <div><span className="text-muted-foreground">Type:</span> {job.jobType}</div>
                  {job.thingsToDo && <div><span className="text-muted-foreground">Notes:</span> {job.thingsToDo}</div>}
                  <div className="flex gap-4">
                    {job.time && <span><span className="text-muted-foreground">Arrival time:</span> {job.time}</span>}
                    <span><span className="text-muted-foreground">Due date:</span> {job.dueDate}</span>
                  </div>
                  <div className="flex gap-4">
                    {job.startDate && <span><span className="text-muted-foreground">Start date:</span> {job.startDate}</span>}
                    {job.endDate && <span><span className="text-muted-foreground">End date:</span> {job.endDate}</span>}
                  </div>
                  {job.dateDone && <div><span className="text-muted-foreground">Done:</span> {job.dateDone}</div>}
                  {(job.totalCost !== undefined || job.totalCharged !== undefined) && (
                    <div className="flex gap-4 pt-1">
                      {job.totalCost !== undefined && <span><span className="text-muted-foreground">Total cost:</span> £{job.totalCost.toFixed(2)}</span>}
                      {job.totalCharged !== undefined && <span><span className="text-muted-foreground">Total charged to landlord:</span> £{job.totalCharged.toFixed(2)}</span>}
                    </div>
                  )}
                </div>
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

            {canManageMaintenance && (
              <div className="flex justify-end gap-2">
                {job.status !== "CANCELLED" && job.status !== "COMPLETED" && (
                  <Button variant="outline" onClick={handleCancelJob}>Cancel Job</Button>
                )}
                {job.status !== "COMPLETED" && (
                  <Button onClick={handleCompleteJob}>Complete Job</Button>
                )}
              </div>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-3">Attached media</div>
                {job.media && job.media.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {job.media.map((src, index) => (
                      <div key={index} className="relative group">
                        {src.startsWith("data:application/pdf") ? (
                          <embed src={src} type="application/pdf" className="w-full h-32 rounded-md border" />
                        ) : (
                          <img src={src} alt={`Attachment ${index + 1}`} className="object-cover rounded-md shadow-sm w-full h-32" />
                        )}
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
