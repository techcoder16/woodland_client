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

  console.log(`🔍 SelectField [${name}] Render:`, {
    currentValue,
    defaultValue,
    type: typeof currentValue,
  });

  // Handle value change
  const handleChange = (value: string) => {
    console.log(`✏️ SelectField [${name}] handleChange called:`, {
      oldValue: currentValue,
      newValue: value,
    });
    
    // Set value with proper options to trigger form updates
    setValue(name, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    
    console.log(`✅ SelectField [${name}] setValue completed`);
    
    // Call the custom onChange if provided
    if (onChange) {
      onChange(value);
    }
  };

  console.log(`📺 SelectField [${name}] Rendering Select with value:`, currentValue?.toString() || "");

  return (
    <div className="p-3 rounded-sm">
      <div className="space-y-2">
        <label className="text-gray-700 text-sm font-medium mr-4 w-32">{label}</label>
        
        {/* Hidden input for react-hook-form registration */}
        <input type="hidden" {...register(name)} value={currentValue || ""} />
        
        {/* Radix UI Select - controlled by currentValue */}
        <Select
          value={currentValue?.toString() || undefined}
          onValueChange={handleChange}
          defaultValue={undefined}
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
      </div>
      
      {error && <p className="text-red-500 mt-1 mx-2 justify-center flex">{error}</p>}
    </div>
  );
};

export default SelectField;