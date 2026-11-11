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
import { Plus, Edit, Trash2, User } from "lucide-react";
import Notes from "./Notes";
import { useAuth } from "@/context/AuthContext";
import { plainText } from "@/helper/plainText";

const noteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
  date: z.string().optional(),
  employeeId: z.string().min(1, "Employee is required"),
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

  const { user } = useAuth();
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

  // toISOString() converts to UTC, so a note added late in the evening during
  // BST would save as the previous day. Read the local calendar date instead.
  // Notes are stamped automatically with the local date and time they were added.
  const toLocalDateTime = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;


  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingLocalId(null);
    // A new note defaults to today — the date is required, so a blank field
    // just made every note an extra click.
    reset({ content: "", date: "", employeeId: "" });
  };

  const onSubmit = (data: NoteFormData) => {
    if (editingLocalId) {
      // Editing keeps the original timestamp.
      onDraftsChange?.(drafts.map((n) => (n.localId === editingLocalId ? { ...data, date: n.date, localId: editingLocalId } : n)));
    } else {
      onDraftsChange?.([...drafts, { ...data, date: toLocalDateTime(new Date()), localId: crypto.randomUUID() }]);
    }
    closeDialog();
  };

  const handleEdit = (note: DraftNote) => {
    setEditingLocalId(note.localId);
    setValue("content", note.content);
    setValue("date", note.date);
    setValue("employeeId", note.employeeId);
    setIsDialogOpen(true);
  };

  const handleDelete = (localId: string) => {
    onDraftsChange?.(drafts.filter((n) => n.localId !== localId));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Property Notes</h3>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              setIsDialogOpen(true);
              if (user?.id) setValue("employeeId", user.id);
              // Prefill today when adding; an edit sets its own date after this.
            } else {
              closeDialog();
            }
          }}
        >
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
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium text-sm">Date &amp; time</label>
                  <p className="text-sm py-2">{editingLocalId ? drafts.find((n) => n.localId === editingLocalId)?.date : "Now (set automatically)"}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium text-sm">Added by</label>
                  <p className="text-sm py-2">
                    {user ? `${user.first_name} ${user.last_name}`.trim() || user.email : "-"}
                  </p>
                </div>
              </div>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No notes added yet. These will be saved once the property is published.
                  </TableCell>
                </TableRow>
              ) : (
                drafts.map((note) => (
                  <TableRow key={note.localId}>
                    <TableCell>{note.date || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{plainText(note.content, { collapseWhitespace: true })}</TableCell>
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
