import { useCallback, useEffect, useState } from "react";
import { Building2, Edit, Loader2, Plus, Search, Trash } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { del, get, patch, post } from "@/helper/api";
import { useAuth } from "@/context/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toast } from "sonner";
import { CouncilCustomer } from "./occupancyShared";

type FormState = Omit<CouncilCustomer, "id" | "liveOccupancies">;

const EMPTY: FormState = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  town: "",
  postCode: "",
  defaultTeam: "",
  notes: "",
};

const FIELDS: { key: keyof FormState; label: string; type?: string; full?: boolean }[] = [
  { key: "contactName", label: "Main Contact" },
  { key: "defaultTeam", label: "Team", },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "addressLine1", label: "Address Line 1", full: true },
  { key: "addressLine2", label: "Address Line 2", full: true },
  { key: "town", label: "Town" },
  { key: "postCode", label: "Postcode" },
];

export default function CouncilCustomers() {
  const { isAdmin } = useAuth();
  const [councils, setCouncils] = useState<CouncilCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 300);
  const [editing, setEditing] = useState<CouncilCustomer | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await get<{ councils: CouncilCustomer[] }>(`occupancy/councils?search=${encodeURIComponent(debounced)}`);
    if (error) toast.error(error.message);
    setCouncils(data?.councils || []);
    setLoading(false);
  }, [debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const openForm = (council?: CouncilCustomer) => {
    setEditing(council || null);
    setForm(council ? { ...EMPTY, ...Object.fromEntries(Object.entries(council).filter(([, v]) => v != null)) } as FormState : EMPTY);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Council name is required");
    setSaving(true);
    // Send only filled fields, so empty optional inputs don't fail email validation.
    const body = Object.fromEntries(
      Object.entries(form)
        .filter(([k]) => k in EMPTY)
        .map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
        .filter(([, v]) => v !== ""),
    );
    const { error } = editing ? await patch(`occupancy/councils/${editing.id}`, body) : await post("occupancy/councils", body);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Council updated" : "Council added");
    setOpen(false);
    load();
  };

  const remove = async (council: CouncilCustomer) => {
    if (!window.confirm(`Delete ${council.name}?`)) return;
    const { error } = await del(`occupancy/councils/${council.id}`);
    if (error) return toast.error(error.message);
    toast.success("Council deleted");
    load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="hero-stat text-[2rem]">Council Customers</h1>
            <p className="text-sm text-muted-foreground mt-1">Local authorities that pay for council occupancies</p>
          </div>
          <Button onClick={() => openForm()}>
            <Plus className="mr-2 h-4 w-4" /> Add Council
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search councils..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Council</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Live Occupancies</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
                ) : councils.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No councils yet.</p>
                      <Button variant="link" onClick={() => openForm()}>Add your first council</Button>
                    </td>
                  </tr>
                ) : (
                  councils.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.name}</p>
                        {c.defaultTeam && <p className="text-xs text-muted-foreground">{c.defaultTeam}</p>}
                      </td>
                      <td className="px-4 py-3">{c.contactName || "-"}</td>
                      <td className="px-4 py-3">{c.email || "-"}</td>
                      <td className="px-4 py-3">{c.phone || "-"}</td>
                      <td className="px-4 py-3 tabular-nums">{c.liveOccupancies ?? 0}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => openForm(c)} aria-label={`Edit ${c.name}`}><Edit className="h-4 w-4" /></Button>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => remove(c)} aria-label={`Delete ${c.name}`}><Trash className="h-4 w-4 text-destructive" /></Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Council" : "Add Council"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Council Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} placeholder="e.g. Southampton City Council" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            {FIELDS.map((f) => (
              <div key={f.key} className={`space-y-1.5 ${f.full ? "sm:col-span-2" : ""}`}>
                <Label>{f.label}</Label>
                <Input type={f.type || "text"} value={(form[f.key] as string) || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
