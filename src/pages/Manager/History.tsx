import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import {
  fetchHistory,
  createHistoryEntry,
  updateHistoryEntry,
  deleteHistoryEntry,
  fetchTermination,
  saveTermination,
  HistoryEntry,
  Termination,
} from "@/redux/dataStore/historySlice";

const EVENT_OPTIONS = [
  "Move In",
  "Move Out",
  "Rent Review",
  "Tenancy Renewal",
  "Property Inspection",
  "Maintenance Visit",
  "Gas Safety Check",
  "Electrical Check",
  "EPC Assessment",
  "Deposit Registration",
  "Deposit Release",
  "Notice Served",
  "Court Hearing",
  "Key Handover",
  "Other",
];

const SUBJECT_OPTIONS = [
  "FINAL RENT REMINDER!!!!!!",
  "RENT REMINDER",
  "MAINTENANCE REQUEST",
  "PROPERTY INSPECTION",
  "LEASE RENEWAL",
  "NOTICE TO QUIT",
  "INVENTORY CHECK",
  "GENERAL CORRESPONDENCE",
  "DEPOSIT DISPUTE",
  "REPAIRS & MAINTENANCE",
  "OTHER",
];

const JOB_TYPE_OPTIONS = [
  "General Correspondence",
  "Rent Reminder",
  "Maintenance",
  "Inspection",
  "Legal Notice",
  "Tenancy Issue",
  "Complaint",
  "Other",
];

function daysAgo(dateStr: string): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function printLetter(entry: HistoryEntry, recipient: "landlord" | "tenant", property: any) {
  const win = window.open("", "_blank");
  if (!win) return;
  const address = property?.propertyName || "Property";
  win.document.write(`
    <html><head><title>Letter to ${recipient === "landlord" ? "Landlord" : "Tenant"}</title>
    <style>body{font-family:Arial,sans-serif;margin:40px;font-size:14px}h2{margin-bottom:4px}p{margin:4px 0}.content{margin-top:20px;white-space:pre-wrap}</style>
    </head><body>
    <h2>${address}</h2>
    <p><strong>Date:</strong> ${entry.dated || ""}</p>
    <p><strong>To:</strong> ${recipient === "landlord" ? "Landlord" : "Tenant"}</p>
    <p><strong>Subject:</strong> ${entry.subject || ""}</p>
    <p><strong>Job Type:</strong> ${entry.jobType || ""}</p>
    <div class="content">${entry.content || ""}</div>
    </body></html>
  `);
  win.document.close();
  win.print();
}

interface HistoryProps {
  propertyId: string;
  property?: any;
}

const History = ({ propertyId, property }: HistoryProps) => {
  const dispatch = useAppDispatch();
  const { entries, termination, loading, terminationLoading } = useAppSelector(
    (state) => state.history
  );

  const [localEntries, setLocalEntries] = useState<Array<HistoryEntry & { _isNew?: boolean; _dirty?: boolean }>>([]);
  const [localTermination, setLocalTermination] = useState<Partial<Termination>>({});
  const [terminationDirty, setTerminationDirty] = useState(false);

  useEffect(() => {
    dispatch(fetchHistory(propertyId));
    dispatch(fetchTermination(propertyId));
  }, [dispatch, propertyId]);

  useEffect(() => {
    // Preserve unsaved new entries; replace saved entries with the latest server data
    setLocalEntries((prev) => {
      const unsaved = prev.filter((e) => e._isNew);
      return [...unsaved, ...entries.map((e) => ({ ...e }))];
    });
  }, [entries]);

  useEffect(() => {
    if (termination) {
      setLocalTermination(termination);
    }
  }, [termination]);

  const handleAddEntry = () => {
    const today = new Date().toISOString().split("T")[0];
    setLocalEntries((prev) => [
      { propertyId, event: "", dated: today, jobType: "", jobDone: "", subject: "", content: "", _isNew: true, _dirty: true },
      ...prev,
    ]);
  };

  const updateLocal = (index: number, field: keyof HistoryEntry, value: string) => {
    setLocalEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value, _dirty: true } : e))
    );
  };

  const handleSaveEntry = async (index: number) => {
    const entry = localEntries[index];

    if (entry._isNew) {
      // Remove from local list BEFORE the await so the useEffect merge
      // doesn't re-add it alongside the server copy (avoiding duplicates).
      setLocalEntries((prev) => prev.filter((_, i) => i !== index));
      const { _isNew, _dirty, ...data } = entry as any;
      try {
        await dispatch(createHistoryEntry(data)).unwrap();
        toast.success("History entry created");
      } catch {
        setLocalEntries((prev) => [{ ...entry }, ...prev]);
        toast.error("Failed to save entry");
      }
      return;
    }

    if (entry.id) {
      setLocalEntries((prev) =>
        prev.map((e, i) => (i === index ? { ...e, _dirty: false } : e))
      );
      const { _isNew, _dirty, id, ...data } = entry as any;
      try {
        await dispatch(updateHistoryEntry({ id, entryData: data })).unwrap();
        toast.success("History entry updated");
      } catch {
        setLocalEntries((prev) =>
          prev.map((e, i) => (i === index ? { ...e, _dirty: true } : e))
        );
        toast.error("Failed to save entry");
      }
    }
  };

  const handleDeleteEntry = async (index: number) => {
    const entry = localEntries[index];
    // Remove immediately from local state (optimistic)
    setLocalEntries((prev) => prev.filter((_, i) => i !== index));
    if (entry._isNew) return;
    if (!entry.id) return;
    try {
      await dispatch(deleteHistoryEntry({ id: entry.id, propertyId })).unwrap();
      toast.success("Entry deleted");
    } catch {
      // Restore on failure
      setLocalEntries((prev) => {
        const restored = [...prev];
        restored.splice(index, 0, entry);
        return restored;
      });
      toast.error("Failed to delete entry");
    }
  };

  const handleSaveTermination = async () => {
    try {
      await dispatch(
        saveTermination({ ...localTermination, propertyId } as Termination)
      ).unwrap();
      setTerminationDirty(false);
      toast.success("Termination details saved");
    } catch {
      toast.error("Failed to save termination details");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">History</h3>
        <Button onClick={handleAddEntry} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* History Entries */}
      {loading && entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Loading history...</div>
      ) : localEntries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <p className="font-medium">No history records yet</p>
          <p className="text-sm mt-1">Click "Add" to create the first entry</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localEntries.map((entry, index) => (
            <div key={entry.id || `new-${index}`} className="border rounded-lg p-4 bg-white shadow-sm">
              {/* Row 0: Event */}
              <div className="mb-3">
                <Label className="text-xs text-gray-500 mb-1 block">Event</Label>
                <select
                  value={entry.event || ""}
                  onChange={(e) => updateLocal(index, "event", e.target.value)}
                  className="w-full h-9 text-sm border border-input rounded-md px-2 bg-background"
                >
                  <option value="">Select event...</option>
                  {EVENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Row 1: Date, Days Ago, Job Type, Job Done */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Dated</Label>
                  <Input
                    type="date"
                    value={entry.dated || ""}
                    onChange={(e) => updateLocal(index, "dated", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Days Ago</Label>
                  <Input
                    value={entry.dated ? daysAgo(entry.dated) : ""}
                    readOnly
                    className="h-8 text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Job Type</Label>
                  <select
                    value={entry.jobType || ""}
                    onChange={(e) => updateLocal(index, "jobType", e.target.value)}
                    className="w-full h-8 text-sm border border-input rounded-md px-2 bg-background"
                  >
                    <option value="">Select...</option>
                    {JOB_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Job Done</Label>
                  <Input
                    value={entry.jobDone || ""}
                    onChange={(e) => updateLocal(index, "jobDone", e.target.value)}
                    placeholder="Job done..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Subject */}
              <div className="mb-3">
                <Label className="text-xs text-gray-500 mb-1 block">Subject</Label>
                <select
                  value={entry.subject || ""}
                  onChange={(e) => updateLocal(index, "subject", e.target.value)}
                  className="w-full h-9 text-sm border border-input rounded-md px-2 bg-background"
                >
                  <option value="">Select subject...</option>
                  {SUBJECT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Row 3: Letter content */}
              <div className="mb-3">
                <Label className="text-xs text-gray-500 mb-1 block">Content</Label>
                <Textarea
                  value={entry.content || ""}
                  onChange={(e) => updateLocal(index, "content", e.target.value)}
                  placeholder="Enter letter content..."
                  rows={5}
                  className="text-sm resize-none"
                />
              </div>

              {/* Row 4: Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => handleDeleteEntry(index)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printLetter(entry, "landlord", property)}
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Letter To Landlord
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printLetter(entry, "tenant", property)}
                >
                  <Printer className="h-3.5 w-3.5 mr-1" /> Letter To Tenant
                </Button>
                {entry._dirty && (
                  <Button size="sm" onClick={() => handleSaveEntry(index)}>
                    Save
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Termination Section */}
      <div className="border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white rounded-t-lg">
          <h4 className="font-semibold text-sm">Termination</h4>
          {terminationDirty && (
            <Button size="sm" onClick={handleSaveTermination} disabled={terminationLoading}>
              Save Termination
            </Button>
          )}
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Final Electricity Reading</Label>
              <Input
                value={localTermination.finalElectricityReading || ""}
                onChange={(e) => { setLocalTermination((t) => ({ ...t, finalElectricityReading: e.target.value })); setTerminationDirty(true); }}
                placeholder="e.g. 12345"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Final Gas Reading</Label>
              <Input
                value={localTermination.finalGasReading || ""}
                onChange={(e) => { setLocalTermination((t) => ({ ...t, finalGasReading: e.target.value })); setTerminationDirty(true); }}
                placeholder="e.g. 12345"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Final Water Reading</Label>
              <Input
                value={localTermination.finalWaterReading || ""}
                onChange={(e) => { setLocalTermination((t) => ({ ...t, finalWaterReading: e.target.value })); setTerminationDirty(true); }}
                placeholder="e.g. 12345"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Deposit Cleared On</Label>
              <Input
                type="date"
                value={localTermination.depositClearedOn || ""}
                onChange={(e) => { setLocalTermination((t) => ({ ...t, depositClearedOn: e.target.value })); setTerminationDirty(true); }}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">New Address of Tenant</Label>
            <Textarea
              value={localTermination.newAddressOfTenant || ""}
              onChange={(e) => { setLocalTermination((t) => ({ ...t, newAddressOfTenant: e.target.value })); setTerminationDirty(true); }}
              placeholder="Enter new tenant address..."
              rows={6}
              className="text-sm resize-none"
            />
          </div>
        </div>
        {terminationDirty && (
          <div className="px-4 pb-4 flex justify-end">
            <Button size="sm" onClick={handleSaveTermination} disabled={terminationLoading}>
              {terminationLoading ? "Saving..." : "Save Termination"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
