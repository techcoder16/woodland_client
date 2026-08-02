import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fetchContractors } from "@/redux/dataStore/contractorSlice";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";

interface ContractorOption {
  value: string;
  label: string;
}

interface ContractorPickerProps {
  label: string;
  name: string;
  watch: (name: string) => any;
  setValue: (name: string, value: any, options?: any) => void;
  clearErrors: (name: string) => void;
  error?: string;
  selectedLabel?: string;
}

const ContractorPicker: React.FC<ContractorPickerProps> = ({
  label,
  name,
  watch,
  setValue,
  clearErrors,
  error,
  selectedLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { contractors, loading } = useAppSelector((state) => state.contractors);

  const currentValue = watch(name);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(fetchContractors({ page: 1, search: searchTerm }));
    }, open ? 300 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, searchTerm, dispatch]);

  const contractorOptions: ContractorOption[] = (contractors || []).map((contractor: any) => ({
    value: contractor.id,
    label: contractor.company ? `${contractor.name} (${contractor.company})` : contractor.name,
  }));

  const selectedContractor = contractorOptions.find((c) => c.value === currentValue);
  const displayLabel = selectedContractor?.label || selectedLabel;

  const handleSelect = (value: string) => {
    setValue(name, value, { shouldValidate: true, shouldDirty: true });
    clearErrors(name);
    setOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-muted-foreground font-medium text-sm">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {displayLabel || "Search and select a contractor..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search contractors..."
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
                  <CommandEmpty>No contractor found.</CommandEmpty>
                  <CommandGroup>
                    {contractorOptions.map((contractor) => (
                      <CommandItem
                        key={contractor.value}
                        value={contractor.value}
                        onSelect={() => handleSelect(contractor.value)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            currentValue === contractor.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {contractor.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem value="__add_new_contractor__" onSelect={() => navigate("/contractors/add")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add new contractor
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
};

export default ContractorPicker;
