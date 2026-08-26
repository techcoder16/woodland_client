import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { get } from "@/helper/api";

export interface MaintenanceJobOption {
  value: string;
  label: string;
  totalCharged?: number | null;
  totalCost?: number | null;
}

interface JobTypeApiResponse {
  jobTypes: any[];
}

interface MaintenancePickerProps {
  propertyId: string;
  /** Currently linked job ids. */
  value: string[] | null | undefined;
  /** Fires with the full updated selection plus the summed totalCharged across all selected (completed) jobs. */
  onChange: (jobIds: string[], totalCharged: number, jobs: MaintenanceJobOption[]) => void;
  disabled?: boolean;
  /** Fallback labels to show before the option list has loaded (e.g. when editing an existing row). */
  selectedLabels?: string[];
}

/**
 * Multi-select searchable picker for a property's COMPLETED maintenance jobs
 * — used to link a transaction's building expenditure to the job(s) it's
 * billing for. Selecting jobs sums their totalCharged (what's billed to the
 * landlord) for the caller to drop into toLandlordLessBuildingExpenditure.
 * Only completed jobs are listed since only finished work has a final cost.
 */
const MaintenancePicker: React.FC<MaintenancePickerProps> = ({
  propertyId,
  value,
  onChange,
  disabled,
  selectedLabels,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<MaintenanceJobOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const selected = value ?? [];

  const fetchOptions = useCallback(async (search: string) => {
    if (!propertyId) return [];
    const params = new URLSearchParams({ propertyId, status: "COMPLETED", limit: "50" });
    if (search) params.append("search", search);
    const { data } = await get<JobTypeApiResponse>(`property-management/job-type?${params.toString()}`);
    const jobs = data?.jobTypes ?? [];
    return jobs.map((job: any): MaintenanceJobOption => ({
      value: job.id,
      label: `${job.jobType || "Job"} — ${job.description || ""}`.trim(),
      totalCharged: job.totalCharged,
      totalCost: job.totalCost,
    }));
  }, [propertyId]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setOptions(await fetchOptions(searchTerm));
      } finally {
        setLoading(false);
      }
    }, searchTerm ? 300 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [open, searchTerm, fetchOptions]);

  const toggle = (job: MaintenanceJobOption) => {
    const isSelected = selected.includes(job.value);
    const nextIds = isSelected ? selected.filter((id) => id !== job.value) : [...selected, job.value];

    // Merge freshly-toggled option into whatever we already know about
    // selected jobs so the sum stays correct even for ids selected before
    // this fetch (e.g. loaded from selectedLabels only).
    const knownJobs = new Map(options.map((o) => [o.value, o]));
    knownJobs.set(job.value, job);
    const nextJobs = nextIds.map((id) => knownJobs.get(id)).filter(Boolean) as MaintenanceJobOption[];
    const totalCharged = nextJobs.reduce((sum, j) => sum + (Number(j.totalCharged) || 0), 0);

    onChange(nextIds, totalCharged, nextJobs);
  };

  const selectedOptions = options.filter((o) => selected.includes(o.value));
  const displayLabels = selectedOptions.length > 0
    ? selectedOptions.map((o) => o.label)
    : selectedLabels;

  const displayText = displayLabels && displayLabels.length > 0
    ? displayLabels.length === 1
      ? displayLabels[0]
      : `${displayLabels.length} jobs selected`
    : "Select completed maintenance...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search completed jobs..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>No completed maintenance jobs found.</CommandEmpty>
                <CommandGroup>
                  {options.map((job) => {
                    const isSelected = selected.includes(job.value);
                    return (
                      <CommandItem
                        key={job.value}
                        value={job.value}
                        onSelect={() => toggle(job)}
                        className="gap-2"
                      >
                        <Checkbox checked={isSelected} className="pointer-events-none" />
                        <div className="flex flex-col">
                          <span>{job.label}</span>
                          {job.totalCharged != null && (
                            <span className="text-xs text-muted-foreground">Charged: £{Number(job.totalCharged).toFixed(2)}</span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 p-2">
          <span className="text-xs text-muted-foreground">
            {selected.length > 0 ? `${selected.length} selected` : "None selected"}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MaintenancePicker;
