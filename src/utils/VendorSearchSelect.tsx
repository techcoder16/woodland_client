import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fetchVendors } from "@/redux/dataStore/vendorSlice";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";

interface VendorSearchSelectProps {
  label?: string;
  value: string;
  onChange: (vendorId: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

// Same server-searched combobox pattern as VendorPicker/PropertyPicker,
// but bound to plain useState instead of react-hook-form — for pages like
// New Landlord Payment that don't use a form library.
const VendorSearchSelect: React.FC<VendorSearchSelectProps> = ({
  label,
  value,
  onChange,
  placeholder = "Search and select a landlord...",
  error,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useAppDispatch();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { vendors, loading } = useAppSelector((state) => state.vendors);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(fetchVendors({ page: 1, search: searchTerm }));
    }, searchTerm ? 300 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, searchTerm, dispatch]);

  const options = (vendors || []).map((vendor: any) => ({
    value: vendor.id,
    label: `${vendor.firstName ?? ""} ${vendor.lastName ?? ""}`.trim() || vendor.email,
  }));
  const selected = options.find((o) => o.value === value);

  const handleSelect = (vendorId: string) => {
    onChange(vendorId);
    setOpen(false);
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="text-muted-foreground font-medium text-sm">{label}</label>}
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
            <span className="truncate">{selected?.label || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search landlords..." value={searchTerm} onValueChange={setSearchTerm} />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No landlord found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem key={option.value} value={option.value} onSelect={() => handleSelect(option.value)}>
                        <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
};

export default VendorSearchSelect;
