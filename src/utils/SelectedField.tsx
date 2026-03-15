import React, { useEffect } from "react";
import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface SelectFieldProps {
  label: string;
  name: string;
  options: { label: string; value: string }[];
  register: UseFormRegister<any>;
  error?: string;
  setValue: UseFormSetValue<any>;
  defaultValue?: string;
  watch: UseFormWatch<any>;
  onChange?: (value: string) => void;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  register,
  error,
  setValue,
  watch,
  defaultValue = "",
  onChange,
}) => {
  const currentValue = watch(name); // Get the current value of the field
  
  // Convert value to string and handle null/undefined
  const stringValue = currentValue !== null && currentValue !== undefined 
    ? String(currentValue) 
    : "";
  
  // Check if the current value exists in options
  const isValidValue = stringValue && options?.some(opt => String(opt.value) === stringValue);
  const displayValue = isValidValue ? stringValue : undefined;
  
  // Ensure the hidden input is registered properly
  useEffect(() => {
    // Register the field if not already registered
    register(name);
  }, [name, register]);

  // Handle value change
  const handleChange = (value: string) => {
    // Set value with proper options to trigger form updates
    setValue(name, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    
    // Call the custom onChange if provided
    if (onChange) {
      onChange(value);
    }
  };

  // Register the field for validation
  const { ref, ...registerRest } = register(name);

  return (
    <div className="p-3 rounded-sm">
      <div className="space-y-2">
        <label className="text-gray-700 text-sm font-medium mr-4 w-32">{label}</label>
        
        {/* Radix UI Select - controlled by currentValue */}
        <Select
          value={displayValue}
          onValueChange={handleChange}
        >
          <SelectTrigger className="">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            {options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Hidden input for react-hook-form registration and validation */}
        <input 
          type="hidden" 
          {...registerRest}
          ref={ref}
          value={stringValue || ""}
        />
      </div>
      
      {error && <p className="text-red-500 mt-1 mx-2 justify-center flex">{error}</p>}
    </div>
  );
};

export default SelectField;