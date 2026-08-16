// src/pages/Manager/Notes.tsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InputField from "@/utils/InputField";
import RichTextEditor from "@/utils/RichTextEditor";
import SelectField from "@/utils/SelectedField";
import { DateField } from "@/utils/DateField";
import EmployeeDropdown from "@/components/EmployeeDropdown";
import ContractorPicker from "@/utils/ContractorPicker";
import { useAuth } from "@/context/AuthContext";
import { StickyNote, Plus, Edit, Trash2, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { get } from "@/helper/api";
import { 
  fetchJobTypes, 
  createJobType, 
  updateJobType, 
  deleteJobType,
  JobType 
} from "@/redux/dataStore/jobTypeSlice";
import { 
  fetchNotes, 
  createNote, 
  updateNote, 
  deleteNote,
  Note 
} from "@/redux/dataStore/noteSlice";

// ----- Zod Schemas ----- //

// Job Type form schema
const jobTypeSchema = z.object({
  jobType: z.string().min(1, "Job type is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  schedule: z.string().optional(),
  time: z.string().optional(),
  thingsToDo: z.string().optional(),
  assignedType: z.enum(["employee", "contractor"], {
    errorMap: () => ({ message: "Select employee or contractor" }),
  }),
  employeeId: z.string().optional(),
  contractorId: z.string().optional(),
  priority: z.string().optional(),
  dateDone: z.string().optional(),
  status: z.enum(["QUOTING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("QUOTING"),
});

// Enhanced Note form schema
const noteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
  date: z.string().min(1, "Date is required"),
  employeeId: z.string().min(1, "Employee is required"),
  detail: z.string().optional(),
});

type JobTypeFormData = z.infer<typeof jobTypeSchema>;
type NoteFormData = z.infer<typeof noteSchema>;

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

interface NotesProps {
  propertyId: string;
  property?: any;
}

const Notes = ({ propertyId, property }: NotesProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"notes" | "jobtypes">("notes");
  const [isJobTypeDialogOpen, setIsJobTypeDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Redux state
  const { jobTypes, loading: jobTypesLoading, error: jobTypesError } = useAppSelector(state => state.jobTypes);
  const { notes, loading: notesLoading, error: notesError } = useAppSelector(state => state.notes);
  
  // Debug logging
  console.log('Notes component state:', { 
    notesCount: notes?.length || 0, 
    notesLoading, 
    notesError, 
    propertyId 
  });

  // Fetch data on component mount
  // Fetch users for employee name lookup
  const fetchUsers = async () => {
    try {
      const { data, error } = await get<User[]>('user/all');
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      if (data) {
        setUsers(data);
        console.log('Users loaded:', data.length);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Get employee display name from ID
  const getEmployeeName = (employeeId: string) => {
    const user = users.find(u => u.id === employeeId);
    if (user) {
      if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
      }
      return user.email;
    }
    return employeeId; // Fallback to ID if user not found
  };

  useEffect(() => {
    if (propertyId) {
      console.log('Fetching data for propertyId:', propertyId);
      dispatch(fetchJobTypes({ propertyId, page: 1 }));
      dispatch(fetchNotes({ propertyId, page: 1, search: "" }));
      fetchUsers(); // Also fetch users for employee name lookup
    }
  }, [dispatch, propertyId]);

  // Test function to create a sample note
  const createTestNote = async () => {
    try {
      const testNote = {
        propertyId,
        content: 'Test note content',
        date: new Date().toISOString().split('T')[0],
        employeeId: 'test-employee-id', // Changed from employee to employeeId
        detail: 'This is a test note for debugging'
      };
      
      await dispatch(createNote(testNote)).unwrap();
      console.log('Test note created successfully');
    } catch (error: any) {
      console.error('Failed to create test note:', error);
    }
  };

  // Date change handlers
  const handleNoteDateChange = (field: keyof NoteFormData, date: Date) => {
    setNoteValue(field, date.toISOString().split('T')[0]);
  };

  const handleJobTypeDateChange = (field: keyof JobTypeFormData, date: Date) => {
    setJobTypeValue(field, date.toISOString().split('T')[0]);
  };

  // Job Type Form Setup
  const {
    register: registerJobType,
    handleSubmit: handleSubmitJobType,
    reset: resetJobType,
    setValue: setJobTypeValue,
    watch: watchJobType,
    clearErrors: clearJobTypeErrors,
    formState: { errors: errorsJobType },
  } = useForm<JobTypeFormData>({
    resolver: zodResolver(jobTypeSchema),
  });

  // Note Form Setup
  const {
    register: registerNote,
    handleSubmit: handleSubmitNote,
    reset: resetNote,
    setValue: setNoteValue,
    watch: watchNote,
    formState: { errors: errorsNote },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
  });

  // Submit Handlers
  const onSubmitJobType = async (data: JobTypeFormData) => {
    try {
      const payload: Omit<JobType, 'id'> = {
        propertyId,
        jobType: data.jobType,
        description: data.description,
        dueDate: data.dueDate,
        schedule: data.schedule,
        time: data.time,
        thingsToDo: data.thingsToDo,
        employeeId: data.assignedType === "employee" ? data.employeeId : undefined,
        contractorId: data.assignedType === "contractor" ? data.contractorId : undefined,
        priority: data.priority,
        dateDone: data.dateDone,
        status: data.status
      };
      
      if (editingJobType && editingJobType.id) {
        // Update existing job type
        await dispatch(updateJobType({ id: editingJobType.id, jobTypeData: payload }));
        toast.success("Job type updated successfully");
      } else {
        // Create new job type
        await dispatch(createJobType(payload));
        toast.success("Job type created successfully");
      }
      
      resetJobType();
      setIsJobTypeDialogOpen(false);
      setEditingJobType(null);
    } catch (error) {
      toast.error("Error saving job type");
    }
  };

  const onSubmitNote = async (data: NoteFormData) => {
    try {
      const payload: Omit<Note, 'id'> = { 
        propertyId,
        content: data.content,
        date: data.date,
        employeeId: data.employeeId, // Changed from employee to employeeId
        detail: data.detail
      };
      
      if (editingNote && editingNote.id) {
        // Update existing note
        await dispatch(updateNote({ id: editingNote.id, noteData: payload }));
        toast.success("Note updated successfully");
      } else {
        // Create new note
        await dispatch(createNote(payload));
        toast.success("Note created successfully");
      }
      
      resetNote();
      setIsNoteDialogOpen(false);
      setEditingNote(null);
    } catch (error) {
      toast.error("Error saving note");
    }
  };

  // Edit handlers
  const handleEditJobType = (jobType: JobType) => {
    setEditingJobType(jobType);
    setJobTypeValue("jobType", jobType.jobType);
    setJobTypeValue("description", jobType.description);
    setJobTypeValue("dueDate", jobType.dueDate);
    setJobTypeValue("schedule", jobType.schedule || "");
    setJobTypeValue("time", jobType.time || "");
    setJobTypeValue("thingsToDo", jobType.thingsToDo || "");
    setJobTypeValue("assignedType", jobType.contractorId ? "contractor" : "employee");
    setJobTypeValue("employeeId", jobType.employeeId || "");
    setJobTypeValue("contractorId", jobType.contractorId || "");
    setJobTypeValue("priority", jobType.priority || "");
    setJobTypeValue("dateDone", jobType.dateDone || "");
    setJobTypeValue("status", jobType.status);
    setIsJobTypeDialogOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteValue("content", note.content);
    setNoteValue("date", note.date);
    setNoteValue("employeeId", note.employeeId); // Changed from employee to employeeId
    setNoteValue("detail", note.detail || "");
    setIsNoteDialogOpen(true);
  };

  // Delete handlers
  const handleDeleteJobType = async (jobType: JobType) => {
    if (jobType.id) {
      try {
        await dispatch(deleteJobType({ id: jobType.id, propertyId }));
        toast.success("Job type deleted successfully");
      } catch (error) {
        toast.error("Error deleting job type");
      }
    }
  };

  const handleDeleteNote = async (note: Note) => {
    if (note.id) {
      try {
        await dispatch(deleteNote({ id: note.id, propertyId }));
        toast.success("Note deleted successfully");
      } catch (error) {
        toast.error("Error deleting note");
      }
    }
  };

  // Reset forms when dialog closes
  const handleJobTypeDialogClose = () => {
    setIsJobTypeDialogOpen(false);
    setEditingJobType(null);
    resetJobType();
  };

  const handleNoteDialogClose = () => {
    setIsNoteDialogOpen(false);
    setEditingNote(null);
    resetNote();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "done": return "default";
      case "scheduled": return "secondary";
      case "quoting": return "destructive";
      default: return "outline";
    }
  };

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return (
    <div className="space-y-6">
      {/* Notes Tab */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Property Notes</h3>
            <Dialog open={isNoteDialogOpen} onOpenChange={(open) => {
              if (open) {
                setIsNoteDialogOpen(true);
                setEditingNote(null);
                if (user?.id) setNoteValue("employeeId", user.id);
              } else {
                handleNoteDialogClose();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingNote ? "Edit Note" : "Add New Note"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitNote(onSubmitNote)} className="space-y-4">
                  <RichTextEditor
                    label="Note Content"
                    value={watchNote("content") || ""}
                    onChange={(html) => setNoteValue("content", html)}
                    error={errorsNote.content?.message}
                    placeholder="Enter your note content..."
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <DateField
                      label="Date"
                      value={watchNote("date") || ""}
                      onChange={(date) => handleNoteDateChange("date", date)}
                      error={errorsNote.date?.message}
                    />
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-medium text-sm">Added by</label>
                      <p className="text-sm py-2">
                        {user ? `${user.first_name} ${user.last_name}`.trim() || user.email : "-"}
                      </p>
                    </div>
                  </div>
                  <RichTextEditor
                    label="Additional Details"
                    value={watchNote("detail") || ""}
                    onChange={(html) => setNoteValue("detail", html)}
                    error={errorsNote.detail?.message}
                    placeholder="Additional details (optional)"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleNoteDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingNote ? "Update Note" : "Create Note"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading notes...
                      </TableCell>
                    </TableRow>
                  ) : notes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="space-y-2">
                          <p className="text-lg font-medium">No notes found</p>
                          {notesError ? (
                            <div className="text-destructive">
                              <p>Error: {notesError}</p>
                              <button
                                onClick={() => dispatch(fetchNotes({ propertyId, page: 1, search: "" }))}
                                className="text-sm underline"
                              >
                                Try again
                              </button>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              <p>No notes have been created for this property yet.</p>

                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    notes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>{note.date}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {getEmployeeName(note.employeeId)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{stripHtml(note.content)}</TableCell>
                        <TableCell className="max-w-xs truncate">{note.detail ? stripHtml(note.detail) : "-"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditNote(note)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteNote(note)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Job Types Tab */}
      {activeTab === "jobtypes" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Job Types & Tasks</h3>
            <Dialog open={isJobTypeDialogOpen} onOpenChange={(open) => {
              if (open) {
                setIsJobTypeDialogOpen(true);
                setEditingJobType(null);
              } else {
                handleJobTypeDialogClose();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job Type
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingJobType ? "Edit Job Type" : "Add New Job Type"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitJobType(onSubmitJobType)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Job Type"
                      name="jobType"
                      register={registerJobType}
                      setValue={setJobTypeValue}
                      error={errorsJobType.jobType?.message}
                      placeholder="e.g., Property Inspection"
                    />
                    <SelectField
                      label="Priority"
                      name="priority"
                      register={registerJobType}
                      setValue={setJobTypeValue}
                      watch={watchJobType}
                      error={errorsJobType.priority?.message}
                      options={[
                        { value: "Low", label: "Low" },
                        { value: "Medium", label: "Medium" },
                        { value: "Critical", label: "Critical" }
                      ]}
                    />
                  </div>
                  
                  <RichTextEditor
                    label="Description"
                    value={watchJobType("description") || ""}
                    onChange={(html) => setJobTypeValue("description", html)}
                    error={errorsJobType.description?.message}
                    placeholder="Describe the job type..."
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <DateField
                      label="Due Date"
                      value={watchJobType("dueDate") || ""}
                      onChange={(date) => handleJobTypeDateChange("dueDate", date)}
                      error={errorsJobType.dueDate?.message}
                    />
                    <InputField
                      label="Schedule"
                      name="schedule"
                      register={registerJobType}
                      setValue={setJobTypeValue}
                      error={errorsJobType.schedule?.message}
                      placeholder="e.g., Monthly, Weekly"
                    />
                    <InputField
                      label="Time"
                      name="time"
                      register={registerJobType}
                      setValue={setJobTypeValue}
                      error={errorsJobType.time?.message}
                      placeholder="e.g., 09:00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <SelectField
                      label="Assigned Type"
                      name="assignedType"
                      register={registerJobType}
                      setValue={setJobTypeValue}
                      watch={watchJobType}
                      error={errorsJobType.assignedType?.message}
                      options={[
                        { value: "employee", label: "Employee" },
                        { value: "contractor", label: "Contractor" }
                      ]}
                    />
                    {watchJobType("assignedType") === "contractor" ? (
                      <ContractorPicker
                        label="Contractor"
                        name="contractorId"
                        watch={watchJobType}
                        setValue={setJobTypeValue}
                        clearErrors={clearJobTypeErrors as (name: string) => void}
                        error={errorsJobType.contractorId?.message}
                      />
                    ) : (
                      <div>
                        <EmployeeDropdown
                          label="Employee"
                          onEmployeeSelect={(employeeId) => setJobTypeValue("employeeId", employeeId || "")}
                          selectedEmployeeId={watchJobType("employeeId")}
                          placeholder="Select an employee"
                        />
                        {errorsJobType.employeeId && (
                          <p className="text-sm text-destructive">{errorsJobType.employeeId.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                  {editingJobType && (
                    <p className="text-sm text-muted-foreground">
                      Current status: <Badge variant={getStatusBadgeVariant(editingJobType.status)}>{editingJobType.status}</Badge>
                      {" "}(assign a contractor to move this from Quoting to Scheduled; set Date Done to mark it Done)
                    </p>
                  )}

                  <RichTextEditor
                    label="Things To Do"
                    value={watchJobType("thingsToDo") || ""}
                    onChange={(html) => setJobTypeValue("thingsToDo", html)}
                    error={errorsJobType.thingsToDo?.message}
                    placeholder="List specific tasks to be completed..."
                  />

                  <DateField
                    label="Date Completed"
                    value={watchJobType("dateDone") || ""}
                    onChange={(date) => handleJobTypeDateChange("dateDone", date)}
                    error={errorsJobType.dateDone?.message}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleJobTypeDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingJobType ? "Update Job Type" : "Create Job Type"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobTypesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading job types...
                      </TableCell>
                    </TableRow>
                  ) : jobTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No job types found
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobTypes.map((jobType) => (
                      <TableRow key={jobType.id}>
                        <TableCell className="font-medium">{jobType.jobType}</TableCell>
                        <TableCell className="max-w-xs truncate">{stripHtml(jobType.description)}</TableCell>
                        <TableCell>{jobType.dueDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {jobType.contractorRef
                              ? jobType.contractorRef.name
                              : jobType.employeeId
                                ? getEmployeeName(jobType.employeeId)
                                : "-"}
                            <Badge variant="outline" className="ml-2">
                              {jobType.contractorRef ? "contractor" : "employee"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(jobType.status)}>
                            {jobType.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{jobType.dateDone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditJobType(jobType)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteJobType(jobType)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Notes;
