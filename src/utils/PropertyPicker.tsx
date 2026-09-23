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
import { fetchProperties } from "@/redux/dataStore/propertySlice";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { formatPropertyReference } from "./propertyReference";

interface PropertyPickerProps {
  label?: string;
  value: string;
  onChange: (propertyId: string) => void;
  /** Restrict results to properties belonging to this landlord, if set. */
  vendorId?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

// Server-searched combobox: types re-dispatch fetchProperties with the
// typed search term (debounced), so results aren't limited to whatever
// page 1 happened to return on mount — that silent 10-item cap was why
// property search looked broken on pages that only fetched once.
const PropertyPicker: React.FC<PropertyPickerProps> = ({
  label,
  value,
  onChange,
  vendorId,
  placeholder = "Search and select a property...",
  error,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useAppDispatch();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { properties, loading } = useAppSelector((state) => state.properties);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(fetchProperties({ page: 1, search: searchTerm, propertyStatus: "PUBLISHED" }));
    }, searchTerm ? 300 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, searchTerm, dispatch]);

  const options = (properties || [])
    .filter((property: any) => !vendorId || property.vendorId === vendorId || property.vendor?.id === vendorId)
    .map((property: any) => ({
      value: property.id,
      label: `${formatPropertyReference(property.propertyNumber)} - ${property.addressLine1 || "Address unavailable"}${property.town ? `, ${property.town}` : ""}`,
      raw: property,
    }));

  const selected = options.find((o) => o.value === value);

  const handleSelect = (propertyId: string) => {
    onChange(propertyId);
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
            <CommandInput placeholder="Search by address or reference..." value={searchTerm} onValueChange={setSearchTerm} />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No matching properties.</CommandEmpty>
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

export default PropertyPicker;
