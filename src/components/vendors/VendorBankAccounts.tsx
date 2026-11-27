// A landlord's bank accounts: list, add, edit, remove and choose the default.
// The default is offered first on landlord payments; a property remembers the
// account its last payment went to.
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoHint } from "@/components/ui/hint";
import { del, get, patch, post } from "@/helper/api";

export interface VendorBankAccount {
  id: string;
  bankName?: string | null;
  accountName?: string | null;
  sortCode?: string | null;
  accountNumber?: string | null;
  isDefault: boolean;
}

type Draft = { bankName: string; accountName: string; sortCode: string; accountNumber: string; isDefault: boolean };
const EMPTY: Draft = { bankName: "", accountName: "", sortCode: "", accountNumber: "", isDefault: false };

/** "Barclays · J Smith (20-45-45 | 00998877)" */
export const bankAccountLabel = (a: Partial<VendorBankAccount>) =>
  `${[a.bankName, a.accountName].filter(Boolean).join(" · ") || "Landlord account"} (${a.sortCode || ""} | ${a.accountNumber || ""})`;

export async function fetchVendorBankAccounts(vendorId: string): Promise<VendorBankAccount[]> {
  const { data } = await get<VendorBankAccount[]>(`vendor/${vendorId}/bank-accounts`);
  return Array.isArray(data) ? data : [];
}

export default function VendorBankAccounts({ vendorId, editable = true }: { vendorId: string; editable?: boolean }) {
  const [accounts, setAccounts] = useState<VendorBankAccount[] | null>(null);
  const [editing, setEditing] = useState<VendorBankAccount | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetchVendorBankAccounts(vendorId).then(setAccounts);
  }, [vendorId]);
  useEffect(() => {
    if (vendorId) load();
  }, [vendorId, load]);

  const open = (account: VendorBankAccount | "new") => {
    setEditing(account);
    setDraft(
      account === "new"
        ? { ...EMPTY, isDefault: !accounts?.length }
        : {
            bankName: account.bankName || "",
            accountName: account.accountName || "",
            sortCode: account.sortCode || "",
            accountNumber: account.accountNumber || "",
            isDefault: account.isDefault,
          },
    );
  };

  const save = async () => {
    if (!draft.accountNumber.trim() || !draft.sortCode.trim()) {
      toast.error("Enter the sort code and account number");
      return;
    }
    setSaving(true);
    const { error } =
      editing === "new"
        ? await post(`vendor/${vendorId}/bank-accounts`, draft)
        : await patch(`vendor/${vendorId}/bank-accounts/${(editing as VendorBankAccount).id}`, draft);
    setSaving(false);
    if (error) return toast.error(error.message || "Could not save the bank account");
    toast.success("Bank account saved");
    setEditing(null);
    load();
  };

  const makeDefault = async (account: VendorBankAccount) => {
    const { error } = await post(`vendor/${vendorId}/bank-accounts/${account.id}/default`, {});
    if (error) return toast.error(error.message || "Could not set the default account");
    toast.success("Default bank account updated");
    load();
  };

  const remove = async (account: VendorBankAccount) => {
    if (!window.confirm(`Remove ${bankAccountLabel(account)}?`)) return;
    const { error } = await del(`vendor/${vendorId}/bank-accounts/${account.id}`);
    if (error) return toast.error(error.message || "Could not remove the bank account");
    toast.success("Bank account removed");
    load();
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold">
          Bank accounts
          <InfoHint text="A landlord can have several accounts. The default is offered first on a landlord payment; each property then remembers the account its last payment went to." />
        </div>
        {editable && (
          <Button type="button" size="sm" variant="outline" onClick={() => open("new")}>
            <Plus className="h-4 w-4 mr-1" /> Add account
          </Button>
        )}
      </div>

      {accounts === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bank accounts yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Bank name</th>
                <th className="py-2 pr-3 font-medium">Account name</th>
                <th className="py-2 pr-3 font-medium">Sort code</th>
                <th className="py-2 pr-3 font-medium">Account number</th>
                <th className="py-2 pr-3 font-medium" />
                {editable && <th className="py-2 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2 pr-3">{a.bankName || "-"}</td>
                  <td className="py-2 pr-3">{a.accountName || "-"}</td>
                  <td className="py-2 pr-3 font-mono">{a.sortCode || "-"}</td>
                  <td className="py-2 pr-3 font-mono">{a.accountNumber || "-"}</td>
                  <td className="py-2 pr-3">{a.isDefault && <Badge className="bg-emerald-100 text-emerald-700">Default</Badge>}</td>
                  {editable && (
                    <td className="py-2">
                      <div className="flex justify-end gap-1">
                        {!a.isDefault && (
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" title="Make default" onClick={() => makeDefault(a)}>
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => open(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-600" title="Remove" onClick={() => remove(a)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add bank account" : "Edit bank account"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="vba-bank">Bank name</Label>
              <Input id="vba-bank" value={draft.bankName} onChange={(e) => setDraft((d) => ({ ...d, bankName: e.target.value }))} placeholder="e.g. Barclays" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="vba-name">Account name</Label>
              <Input id="vba-name" value={draft.accountName} onChange={(e) => setDraft((d) => ({ ...d, accountName: e.target.value }))} placeholder="Account holder" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vba-sort">Sort code *</Label>
              <Input id="vba-sort" value={draft.sortCode} onChange={(e) => setDraft((d) => ({ ...d, sortCode: e.target.value }))} placeholder="20-45-45" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vba-no">Account number *</Label>
              <Input id="vba-no" value={draft.accountNumber} onChange={(e) => setDraft((d) => ({ ...d, accountNumber: e.target.value }))} placeholder="00998877" />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={draft.isDefault} onChange={(e) => setDraft((d) => ({ ...d, isDefault: e.target.checked }))} />
              Default account
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button type="button" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
