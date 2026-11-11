import { useCallback, useEffect, useState } from "react";
import { Building2, Search } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { get } from "@/helper/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toast } from "sonner";
import { CouncilCustomer } from "./occupancyShared";

// The councils are a fixed list (the London boroughs). There is nothing to
// add or edit here — properties and occupancies simply link to a council.
export default function CouncilCustomers() {
  const [councils, setCouncils] = useState<CouncilCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 300);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="hero-stat text-[2rem]">Councils</h1>
          <p className="text-sm text-muted-foreground mt-1">Local authorities that properties and council occupancies are linked to</p>
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
                  <th className="px-4 py-3 font-medium">Live Occupancies</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={2} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
                ) : councils.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-12 text-center">
                      <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No councils found.</p>
                    </td>
                  </tr>
                ) : (
                  councils.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 tabular-nums">{c.liveOccupancies ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
