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
import { fetchVendors } from "@/redux/dataStore/vendorSlice";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { renderLabel } from "./FieldLabel";

interface VendorOption {
  value: string;
  label: string;
}

interface VendorPickerProps {
  label: string;
  name: string;
  watch: (name: string) => any;
  setValue: (name: string, value: any, options?: any) => void;
  clearErrors: (name: string) => void;
  error?: string;
  /** Optional: pass an already-fetched label for the currently selected vendor (e.g. when editing). */
  selectedLabel?: string;
}

const VendorPicker: React.FC<VendorPickerProps> = ({
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

  const { vendors, loading } = useAppSelector((state) => state.vendors);

  const currentValue = watch(name);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(fetchVendors({ page: 1, search: searchTerm }));
    }, open ? 300 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, searchTerm, dispatch]);

  const vendorOptions: VendorOption[] = (vendors || []).map((vendor: any) => ({
    value: vendor.id,
    label: `${vendor.firstName ?? ""} ${vendor.lastName ?? ""}`.trim(),
  }));

  const selectedVendor = vendorOptions.find((v) => v.value === currentValue);
  const displayLabel = selectedVendor?.label || selectedLabel;

  const handleSelect = (value: string) => {
    setValue(name, value, { shouldValidate: true, shouldDirty: true });
    clearErrors(name);
    setOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-muted-foreground font-medium text-sm">{renderLabel(label)}</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              {displayLabel || "Search and select a landlord..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search landlords..."
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
                    <CommandEmpty>No landlord found.</CommandEmpty>
                    <CommandGroup>
                      {vendorOptions.map((vendor) => (
                        <CommandItem
                          key={vendor.value}
                          value={vendor.value}
                          onSelect={() => handleSelect(vendor.value)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              currentValue === vendor.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {vendor.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value="__add_new_landlord__" onSelect={() => navigate("/vendors/add")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add new landlord
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

export default VendorPicker;
