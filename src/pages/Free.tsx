import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, Loader2, Search, Send } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAccessToken } from "@/helper/tokenManager";

const API_URL = import.meta.env.VITE_API_URL;

type EntityFilter = "all" | "property" | "tenant" | "vendor";

type Gap = { key: string; label: string; entity: string; count: number; importance: string };

type Summary = {
  byEntity: Record<string, { total: number; complete: number; averageCompleteness: number }>;
  topGaps: Gap[];
  totalRecords: number;
};

type Report = {
  entity: string;
  id: string;
  reference: string;
  present: string[];
  missing: { field: string; label: string; importance: string }[];
  completeness: number;
};

const ENTITY_LABELS: Record<string, string> = {
  all: "Everything",
  property: "Properties",
  tenant: "Tenants",
  vendor: "Landlords",
};

export default function Free() {
  const [entity, setEntity] = useState<EntityFilter>("all");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [scanning, setScanning] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  const runScan = useCallback(async () => {
    setScanning(true);
    setError("");
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}data-audit/scan?entity=${entity}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Scan failed");
      const data = await response.json();
      setSummary(data.summary);
      setReports(data.reports || []);
    } catch {
      setError("Could not scan the database. Check that the server is running.");
      setSummary(null);
      setReports([]);
    } finally {
      setScanning(false);
    }
  }, [entity]);

  useEffect(() => {
    runScan();
  }, [runScan]);

  const ask = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer("");
    setError("");
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}data-audit/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question, entity }),
      });
      if (!response.ok) throw new Error("Ask failed");
      const data = await response.json();
      setAnswer(data.answer || "");
      if (data.summary) setSummary(data.summary);
    } catch {
      setError("The assistant could not answer that. Check that the OCR service is running.");
    } finally {
      setAsking(false);
    }
  };

  const incomplete = reports.filter((report) => report.missing.length > 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Data Completeness</h1>
            <p className="text-sm text-muted-foreground">
              Check which data is recorded and which is still missing across properties, tenants and landlords.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Label className="mb-1 block">Scope</Label>
            <Select value={entity} onValueChange={(value) => setEntity(value as EntityFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ENTITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={runScan} disabled={scanning} variant="outline">
            {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Rescan
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(summary.byEntity).map(([name, stats]) => (
              <div key={name} className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">{ENTITY_LABELS[name] ?? name}</p>
                <p className="mt-1 text-2xl font-semibold">{stats.averageCompleteness}%</p>
                <p className="text-xs text-muted-foreground">
                  {stats.complete} of {stats.total} fully complete
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <Label htmlFor="audit-question">Ask about the data</Label>
          <div className="flex gap-2">
            <Input
              id="audit-question"
              value={question}
              placeholder="e.g. which properties are missing a gas certificate?"
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && ask()}
            />
            <Button onClick={ask} disabled={asking || !question.trim()}>
              {asking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Ask
            </Button>
          </div>
          {answer && (
            <div className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{answer}</div>
          )}
        </div>

        {summary && summary.topGaps.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 font-medium">Most common gaps</h2>
            <div className="space-y-2">
              {summary.topGaps.slice(0, 12).map((gap) => (
                <div key={gap.key} className="flex items-center justify-between text-sm">
                  <span>
                    {gap.label}
                    <span className="ml-2 text-xs text-muted-foreground">({ENTITY_LABELS[gap.entity] ?? gap.entity})</span>
                    {gap.importance === "required" && (
                      <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">required</span>
                    )}
                  </span>
                  <span className="font-medium">{gap.count} missing</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-medium">
            Records with missing data
            <span className="ml-2 text-sm text-muted-foreground">({incomplete.length})</span>
          </h2>
          {scanning ? (
            <p className="text-sm text-muted-foreground">Scanning…</p>
          ) : incomplete.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Every scanned record has all its expected fields.
            </p>
          ) : (
            <div className="space-y-3">
              {incomplete.map((report) => (
                <div key={`${report.entity}-${report.id}`} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{report.reference}</span>
                    <span className="text-sm text-muted-foreground">{report.completeness}% complete</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {report.missing.map((gap) => (
                      <span
                        key={gap.field}
                        className={`rounded px-2 py-0.5 text-xs ${
                          gap.importance === "required"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {gap.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
