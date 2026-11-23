// Small dialogs shared by the Jobs page and the job detail page.
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { JobType } from "@/redux/dataStore/jobTypeSlice";
import { setVisit } from "./jobActions";

interface VisitTimeDialogProps {
  job: JobType;
  disabled?: boolean;
  size?: "sm" | "default";
  onSaved: () => void;
}

/** Sets the contractor's visit date and time for a job. */
export function VisitTimeDialog({ job, disabled, size = "sm", onSaved }: VisitTimeDialogProps) {
  const [open, setOpen] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setVisitDate(job.visitDate ? String(job.visitDate).slice(0, 10) : "");
      setTime(job.time || "");
    }
    setOpen(next);
  };

  const save = async () => {
    if (!visitDate) {
      toast.error("Pick a visit date");
      return;
    }
    setSaving(true);
    try {
      await setVisit(job, visitDate, time);
      toast.success("Visit date saved");
      setOpen(false);
      onSaved();
    } catch (error) {
      toast.error(error?.message || "Failed to save visit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size={size} variant="outline" disabled={disabled}>
          <CalendarClock className="h-4 w-4 mr-2" /> Set visit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Visit date and time</DialogTitle>
          <DialogDescription>When the contractor is due at the property.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="visitDate">Date</Label>
            <Input id="visitDate" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="visitTime">Time</Label>
            <Input id="visitTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Savingâ€¦" : "Save visit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NotePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  /** Required note: the button stays disabled until something is typed. */
  onSubmit: (note: string) => Promise<void>;
}

/** Asks for a short required note, e.g. why a job is not complete. */
export function NotePromptDialog({ open, onOpenChange, title, description, submitLabel, onSubmit }: NotePromptDialogProps) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await onSubmit(note.trim());
      setNote("");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write a noteâ€¦"
          autoFocus
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={saving || !note.trim()}>
            {saving ? "Savingâ€¦" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
