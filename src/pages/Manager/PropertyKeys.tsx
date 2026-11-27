// Property > Keys: each key's number and the office it's kept at, with an
// activity log underneath (who took it, when it was collected and returned).
import { useCallback, useEffect, useState } from "react";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { del, get, patch, post } from "@/helper/api";

export const KEY_LOCATIONS = [
  { value: "PARK_HOUSE", label: "Park House" },
  { value: "CRANBROOK", label: "Cranbrook" },
];
const locationLabel = (v: string) => KEY_LOCATIONS.find((l) => l.value === v)?.label ?? v;

type Activity = {
  id: string;
  activity: string;
  assignedTo?: string | null;
  dateCollected?: string | null;
  dateReturned?: string | null;
  notes?: string | null;
  createdByName?: string | null;
  createdAt: string;
};
type PropertyKey = { id: string; keyNumber: string; location: string; activities: Activity[] };

const dmy = (v?: string | null) => (v ? new Date(v).toLocaleDateString("en-GB") : "-");
const isoDay = (v?: string | null) => (v ? String(v).slice(0, 10) : "");
const toIso = (day: string) => (day ? new Date(`${day}T00:00:00Z`).toISOString() : undefined);

const EMPTY_ACTIVITY = { activity: "", assignedTo: "", dateCollected: "", dateReturned: "", notes: "" };

export default function PropertyKeys({ propertyId }: { propertyId: string }) {
  const [keys, setKeys] = useState<PropertyKey[] | null>(null);
  const [keyForm, setKeyForm] = useState<{ id?: string; keyNumber: string; location: string } | null>(null);
  const [activityForm, setActivityForm] = useState<{ keyId: string; id?: string } & typeof EMPTY_ACTIVITY | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    get<PropertyKey[]>(`property-records/${propertyId}/keys`).then(({ data, error }) => {
      if (error) toast.error(error.message || "Could not load the keys");
      setKeys(Array.isArray(data) ? data : []);
    });
  }, [propertyId]);
  useEffect(() => {
    if (propertyId) load();
  }, [propertyId, load]);

  const saveKey = async () => {
    if (!keyForm) return;
    if (!keyForm.keyNumber.trim()) return toast.error("Enter the key number");
    if (!keyForm.location) return toast.error("Choose where the key is kept");
    setSaving(true);
    const body = { keyNumber: keyForm.keyNumber.trim(), location: keyForm.location };
    const { error } = keyForm.id ? await patch(`property-records/keys/${keyForm.id}`, body) : await post(`property-records/${propertyId}/keys`, body);
    setSaving(false);
    if (error) return toast.error(error.message || "Could not save the key");
    toast.success("Key saved");
    setKeyForm(null);
    load();
  };

  const removeKey = async (key: PropertyKey) => {
    if (!window.confirm(`Delete key ${key.keyNumber} and its activity log?`)) return;
    const { error } = await del(`property-records/keys/${key.id}`);
    if (error) return toast.error(error.message || "Could not delete the key");
    toast.success("Key deleted");
    load();
  };

  const saveActivity = async () => {
    if (!activityForm) return;
    if (!activityForm.activity.trim()) return toast.error("Describe the activity");
    if (activityForm.dateCollected && activityForm.dateReturned && activityForm.dateReturned < activityForm.dateCollected) {
      return toast.error("The return date must be on or after the collected date");
    }
    setSaving(true);
    const body = {
      activity: activityForm.activity.trim(),
      assignedTo: activityForm.assignedTo.trim() || undefined,
      dateCollected: toIso(activityForm.dateCollected),
      dateReturned: toIso(activityForm.dateReturned),
      notes: activityForm.notes.trim() || undefined,
    };
    const { error } = activityForm.id
      ? await patch(`property-records/key-activities/${activityForm.id}`, body)
      : await post(`property-records/keys/${activityForm.keyId}/activities`, body);
    setSaving(false);
    if (error) return toast.error(error.message || "Could not save the activity");
    toast.success("Activity saved");
    setActivityForm(null);
    load();
  };

  const removeActivity = async (a: Activity) => {
    if (!window.confirm("Delete this activity?")) return;
    const { error } = await del(`property-records/key-activities/${a.id}`);
    if (error) return toast.error(error.message || "Could not delete the activity");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Keys</h3>
          <p className="text-sm text-muted-foreground">Key numbers, where each key is kept, and the key activity log.</p>
        </div>
        <Button onClick={() => setKeyForm({ keyNumber: "", location: "" })}><Plus className="mr-2 h-4 w-4" />Add key</Button>
      </div>

      {keys === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : keys.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No keys recorded for this property yet.</div>
      ) : (
        keys.map((key) => (
          <div key={key.id} className="surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <span className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" />Key no. {key.keyNumber}</span>
                <span><span className="text-muted-foreground">Location </span><span className="font-medium">{locationLabel(key.location)}</span></span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setActivityForm({ keyId: key.id, ...EMPTY_ACTIVITY })}><Plus className="mr-1 h-4 w-4" />Add activity</Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit key" onClick={() => setKeyForm({ id: key.id, keyNumber: key.keyNumber, location: key.location })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" title="Delete key" onClick={() => removeKey(key)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            {key.activities.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No activity logged for this key yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      {["Activity", "Assigned to", "Date collected", "Date returned", "Notes", ""].map((h) => (
                        <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {key.activities.map((a) => (
                      <tr key={a.id} className="border-t align-top">
                        <td className="px-4 py-2.5 font-medium">{a.activity}</td>
                        <td className="px-4 py-2.5">{a.assignedTo || "-"}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">{dmy(a.dateCollected)}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">{a.dateReturned ? dmy(a.dateReturned) : a.dateCollected ? <span className="font-medium text-amber-700">Not returned</span> : "-"}</td>
                        <td className="px-4 py-2.5 max-w-xs whitespace-pre-wrap">{a.notes || "-"}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => setActivityForm({ keyId: key.id, id: a.id, activity: a.activity, assignedTo: a.assignedTo || "", dateCollected: isoDay(a.dateCollected), dateReturned: isoDay(a.dateReturned), notes: a.notes || "" })}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" title="Delete" onClick={() => removeActivity(a)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}

      <Dialog open={!!keyForm} onOpenChange={(o) => !o && setKeyForm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{keyForm?.id ? "Edit key" : "Add key"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Key number *</Label><Input value={keyForm?.keyNumber ?? ""} onChange={(e) => setKeyForm((f) => f && { ...f, keyNumber: e.target.value })} placeholder="e.g. K-104" /></div>
            <div className="space-y-1">
              <Label>Location *</Label>
              <Select value={keyForm?.location || undefined} onValueChange={(v) => setKeyForm((f) => f && { ...f, location: v })}>
                <SelectTrigger><SelectValue placeholder="Park House or Cranbrook" /></SelectTrigger>
                <SelectContent>{KEY_LOCATIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyForm(null)} disabled={saving}>Cancel</Button>
            <Button onClick={saveKey} disabled={saving}>{saving ? "Saving…" : "Save key"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activityForm} onOpenChange={(o) => !o && setActivityForm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{activityForm?.id ? "Edit key activity" : "Add key activity"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2"><Label>Activity *</Label><Input value={activityForm?.activity ?? ""} onChange={(e) => setActivityForm((f) => f && { ...f, activity: e.target.value })} placeholder="e.g. Given to contractor for boiler repair" /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Assigned to</Label><Input value={activityForm?.assignedTo ?? ""} onChange={(e) => setActivityForm((f) => f && { ...f, assignedTo: e.target.value })} placeholder="Who has the key" /></div>
            <div className="space-y-1"><Label>Date collected</Label><Input type="date" value={activityForm?.dateCollected ?? ""} onChange={(e) => setActivityForm((f) => f && { ...f, dateCollected: e.target.value })} /></div>
            <div className="space-y-1"><Label>Date returned</Label><Input type="date" min={activityForm?.dateCollected || undefined} value={activityForm?.dateReturned ?? ""} onChange={(e) => setActivityForm((f) => f && { ...f, dateReturned: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={activityForm?.notes ?? ""} onChange={(e) => setActivityForm((f) => f && { ...f, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityForm(null)} disabled={saving}>Cancel</Button>
            <Button onClick={saveActivity} disabled={saving}>{saving ? "Saving…" : "Save activity"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
