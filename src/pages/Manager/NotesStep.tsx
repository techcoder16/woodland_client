// src/pages/Manager/NotesStep.tsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TextAreaField from "@/utils/TextAreaField";
import { DateField } from "@/utils/DateField";
import EmployeeDropdown from "@/components/EmployeeDropdown";
import { Plus, Edit, Trash2, User } from "lucide-react";
import Notes from "./Notes";

const noteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
  date: z.string().min(1, "Date is required"),
  employeeId: z.string().min(1, "Employee is required"),
  detail: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

export interface DraftNote extends NoteFormData {
  localId: string;
}

interface NotesStepProps {
  propertyId: string;
  property?: any;
  mode?: "edit" | "draft";
  drafts?: DraftNote[];
  onDraftsChange?: (notes: DraftNote[]) => void;
}

const NotesStep: React.FC<NotesStepProps> = ({ propertyId, property, mode = "edit", drafts = [], onDraftsChange }) => {
  if (mode === "edit") {
    return <Notes propertyId={propertyId} property={property} />;
  }

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
  });

  const handleDateChange = (date: Date) => {
    setValue("date", date.toISOString().split("T")[0]);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingLocalId(null);
    reset({ content: "", date: "", employeeId: "", detail: "" });
  };

  const onSubmit = (data: NoteFormData) => {
    if (editingLocalId) {
      onDraftsChange?.(drafts.map((n) => (n.localId === editingLocalId ? { ...data, localId: editingLocalId } : n)));
    } else {
      onDraftsChange?.([...drafts, { ...data, localId: crypto.randomUUID() }]);
    }
    closeDialog();
  };

  const handleEdit = (note: DraftNote) => {
    setEditingLocalId(note.localId);
    setValue("content", note.content);
    setValue("date", note.date);
    setValue("employeeId", note.employeeId);
    setValue("detail", note.detail || "");
    setIsDialogOpen(true);
  };

  const handleDelete = (localId: string) => {
    onDraftsChange?.(drafts.filter((n) => n.localId !== localId));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Property Notes</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLocalId ? "Edit Note" : "Add New Note"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <TextAreaField
                label="Note Content"
                name="content"
                register={register}
                error={errors.content?.message}
                placeholder="Enter your note content..."
              />
              <div className="grid grid-cols-2 gap-4">
                <DateField
                  label="Date"
                  value={watch("date") || ""}
                  onChange={handleDateChange}
                  error={errors.date?.message}
                />
                <EmployeeDropdown
                  label="Employee"
                  onEmployeeSelect={(employeeId) => setValue("employeeId", employeeId || "")}
                  selectedEmployeeId={watch("employeeId")}
                  placeholder="Select an employee"
                  required
                />
              </div>
              {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
              <TextAreaField
                label="Additional Details"
                name="detail"
                register={register}
                error={errors.detail?.message}
                placeholder="Additional details (optional)"
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">{editingLocalId ? "Update Note" : "Add Note"}</Button>
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
                <TableHead>Content</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No notes added yet. These will be saved once the property is published.
                  </TableCell>
                </TableRow>
              ) : (
                drafts.map((note) => (
                  <TableRow key={note.localId}>
                    <TableCell>{note.date}</TableCell>
                    <TableCell className="max-w-xs truncate">{note.content}</TableCell>
                    <TableCell className="max-w-xs truncate">{note.detail || "-"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(note)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(note.localId)}>
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
  );
};

export default NotesStep;
