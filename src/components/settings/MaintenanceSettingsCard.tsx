import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { patch } from "@/helper/api";
import { DEFAULT_SLA_SETTINGS, SlaSettings, friendlyTime, loadSlaSettings, setSlaSettingsLocal } from "@/utils/maintenanceSla";

// Office hours and the critical-job times. Saved on the server, so they apply to every user.
// A change affects jobs created (or re-prioritised) after saving; existing due times stay.
const TIME_FIELDS: { key: keyof SlaSettings; label: string; help: string }[] = [
  { key: "officeOpen", label: "Office opens", help: "Office-hour clocks start here each working day (Mon–Fri)." },
  { key: "officeClose", label: "Office closes", help: "Nothing is due after this; time stops until the next working morning." },
  { key: "criticalCutoff", label: "Critical cut-off", help: "A critical job logged before this is due a set number of hours later." },
  { key: "lateDue", label: "After cut-off: due at", help: "A critical job logged at or after the cut-off is due at this time the same day." },
  { key: "lateChaseUp", label: "After cut-off: chase up at", help: "Any job logged at or after the cut-off goes on Chase Up at this time the same day." },
];

export default function MaintenanceSettingsCard() {
  const [values, setValues] = useState<SlaSettings>(DEFAULT_SLA_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSlaSettings().then(setValues);
  }, []);

  const save = async () => {
    setSaving(true);
    const { data, error } = await patch<SlaSettings>("property-management/maintenance-settings", {
      ...values,
      criticalHours: Number(values.criticalHours),
    });
    setSaving(false);
    if (error || !data) {
      toast.error((error as any)?.message || "Could not save the maintenance settings");
      return;
    }
    setSlaSettingsLocal(data);
    setValues(data);
    toast.success("Maintenance settings saved. New jobs use these times.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance due times</CardTitle>
        <CardDescription>
          Office hours and the critical-job rule. Currently: critical before {friendlyTime(values.criticalCutoff)} is due in {values.criticalHours} hours;
          from {friendlyTime(values.criticalCutoff)} it is due {friendlyTime(values.lateDue)} and chased at {friendlyTime(values.lateChaseUp)}. Applies to jobs created after saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {TIME_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`sla-${f.key}`}>{f.label}</Label>
              <Input
                id={`sla-${f.key}`}
                type="time"
                step={300}
                value={String(values[f.key])}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">{f.help}</p>
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="sla-criticalHours">Critical: hours to complete (before cut-off)</Label>
            <Input
              id="sla-criticalHours"
              type="number"
              min={0.25}
              max={24}
              step={0.25}
              value={values.criticalHours}
              onChange={(e) => setValues((v) => ({ ...v, criticalHours: e.target.value as unknown as number }))}
            />
            <p className="text-xs text-muted-foreground">Capped at closing time, so a critical job is never due the next day.</p>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          <Button variant="outline" onClick={() => setValues(DEFAULT_SLA_SETTINGS)} disabled={saving}>Reset to defaults</Button>
        </div>
      </CardContent>
    </Card>
  );
}
