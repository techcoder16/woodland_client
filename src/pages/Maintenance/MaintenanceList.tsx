import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InputField from "@/utils/InputField";
import TextAreaField from "@/utils/TextAreaField";
import SelectField from "@/utils/SelectedField";
import { DateField } from "@/utils/DateField";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Search, Phone, Mail, User2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { get } from "@/helper/api";
import {
  fetchJobTypes,
  createJobType,
  updateJobType,
  deleteJobType,
  JobType,
  ReportingStatus,
} from "@/redux/dataStore/jobTypeSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Department } from "@/types/permissions";

// Matches what CreateJobTypeDto actually persists on create — the backend
// always forces status: QUOTING and ignores contractorId/dates/status here;
// those only become settable afterward via the detail page (admin-gated).
const maintenanceSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  jobType: z.string().min(1, "Type is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  schedule: z.string().optional(),
  time: z.string().optional(),
  thingsToDo: z.string().optional(),
  priority: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface Property {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  town?: string;
  postCode?: string;
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

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

const MaintenanceList = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { jobTypes, loading } = useAppSelector((state) => state.jobTypes);
  const { isDepartmentAdmin } = useAuth();
  const canManageMaintenance = isDepartmentAdmin(Department.Maintenance);

  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportingStatus | "">("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchJobTypes({ page: 1, status: statusFilter || undefined }));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    (async () => {
      const { data } = await get<any>("properties?page=1&limit=200&search=");
      setProperties(data?.items || []);
    })();
    (async () => {
      const { data } = await get<User[]>("user/all");
      setUsers(data || []);
    })();
  }, []);

  const getEmployeeName = (employeeId?: string) => {
    if (!employeeId) return "-";
    const user = users.find((u) => u.id === employeeId);
    if (!user) return employeeId;
    return user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email;
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
  });

  const handleDateChange = (field: keyof MaintenanceFormData, date: Date) => {
    setValue(field, date.toISOString().split("T")[0]);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    reset();
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      // Backend always forces status: QUOTING on create and ignores
      // contractorId/dates/cost fields here — they're set later via the
      // detail page once a Maintenance Department Admin assigns a contractor.
      const payload: Omit<JobType, "id"> = {
        propertyId: data.propertyId,
        jobType: data.jobType,
        description: data.description,
        dueDate: data.dueDate,
        schedule: data.schedule,
        time: data.time,
        thingsToDo: data.thingsToDo,
        priority: data.priority,
        status: "QUOTING",
      };

      await dispatch(createJobType(payload));
      toast.success("Maintenance job created successfully");

      dispatch(fetchJobTypes({ page: 1, status: statusFilter || undefined }));
      closeDialog();
    } catch (error) {
      toast.error("Error saving maintenance job");
    }
  };

  const handleDelete = async (job: JobType) => {
    if (!job.id) return;
    try {
      await dispatch(deleteJobType({ id: job.id, propertyId: job.propertyId }));
      toast.success("Maintenance job deleted successfully");
      dispatch(fetchJobTypes({ page: 1, status: statusFilter || undefined }));
    } catch (error) {
      toast.error("Error deleting maintenance job");
    }
  };

  const handleCompleteJob = async (job: JobType) => {
    if (!job.id) return;
    try {
      await dispatch(
        updateJobType({
          id: job.id,
          jobTypeData: { propertyId: job.propertyId, dateDone: new Date().toISOString().split("T")[0], status: "COMPLETED" },
        })
      );
      toast.success("Maintenance job marked as done");
      dispatch(fetchJobTypes({ page: 1, status: statusFilter || undefined }));
    } catch (error) {
      toast.error("Error completing maintenance job");
    }
  };

  const propertyOptions = properties.map((p) => ({
    value: p.id,
    label: [p.addressLine1, p.town].filter(Boolean).join(", "),
  }));

  const filteredJobTypes = jobTypes.filter((job) => {
    if (!searchTerm) return true;
    const haystack = `${job.jobType} ${job.description} ${formatAddress(job.property)}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="hero-stat text-[2rem]">Maintenance</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Maintenance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <SelectField
                  label="Property"
                  name="propertyId"
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  error={errors.propertyId?.message}
                  options={propertyOptions}
                />

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Type"
                    name="jobType"
                    register={register}
                    setValue={setValue}
                    error={errors.jobType?.message}
                    placeholder="e.g., Leak, Broken window"
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

                <TextAreaField
                  label="Description"
                  name="description"
                  register={register}
                  error={errors.description?.message}
                  placeholder="Describe the issue..."
                />

                <div className="grid grid-cols-3 gap-4">
                  <DateField
                    label="Due Date"
                    value={watch("dueDate") || ""}
                    onChange={(date) => handleDateChange("dueDate", date)}
                    error={errors.dueDate?.message}
                  />
                  <InputField
                    label="Schedule"
                    name="schedule"
                    register={register}
                    setValue={setValue}
                    error={errors.schedule?.message}
                    placeholder="e.g., One-off, Monthly"
                  />
                  <InputField
                    label="Arrival Time"
                    name="time"
                    register={register}
                    setValue={setValue}
                    error={errors.time?.message}
                    placeholder="e.g., 09:00"
                  />
                </div>

                <TextAreaField
                  label="Things To Do"
                  name="thingsToDo"
                  register={register}
                  error={errors.thingsToDo?.message}
                  placeholder="List specific tasks to be completed..."
                />

                <p className="text-sm text-muted-foreground">
                  Contractor assignment, scheduling dates, and cost tracking become available
                  once a Maintenance Department Admin reviews this request.
                </p>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for a maintenance..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {(["", "QUOTING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map((status) => (
              <Button
                key={status || "all"}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status ? STATUS_LABELS[status] : "All"}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse table-auto">
                <thead className="bg-background">
                  <tr className="border-b border-border/70">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Reported</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Landlord</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Contractor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type &amp; Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                        Loading maintenance jobs...
                      </td>
                    </tr>
                  ) : filteredJobTypes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                        No maintenance jobs found
                      </td>
                    </tr>
                  ) : (
                    filteredJobTypes.map((job) => {
                      const vendor = job.property?.vendor;
                      return (
                        <tr key={job.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors align-top">
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">{formatAddress(job.property)}</td>
                          <td className="px-4 py-3 text-sm">
                            {vendor ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 font-medium">
                                  <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                                  {vendor.firstName} {vendor.lastName}
                                </div>
                                {vendor.phone && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3 w-3" /> {vendor.phone}
                                  </div>
                                )}
                                {vendor.email && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Mail className="h-3 w-3" /> {vendor.email}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {job.contractorRef ? job.contractorRef.name : job.employeeId ? getEmployeeName(job.employeeId) : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm max-w-xs">
                            <div className="font-medium">{job.jobType}</div>
                            <div className="text-muted-foreground truncate">{job.description}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {job.priority ? <Badge variant="outline">{job.priority}</Badge> : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">{job.dueDate}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={getStatusBadgeVariant(job.status)}>{STATUS_LABELS[job.status] ?? job.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/maintenance/${job.id}`)}>
                                View details
                              </Button>
                              {canManageMaintenance && job.status !== "COMPLETED" && (
                                <Button size="sm" variant="outline" onClick={() => handleCompleteJob(job)}>
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                              {canManageMaintenance && (
                                <Button size="sm" variant="outline" onClick={() => handleDelete(job)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MaintenanceList;
