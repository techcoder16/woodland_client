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
  console.log(`${name} current value:`, currentValue);

  useEffect(() => {
    if (defaultValue) {
      setValue(name, defaultValue);
    }
  }, [defaultValue, name, setValue]);

  // Ensure the value is properly set when component mounts
  useEffect(() => {
    // If there's a current value but it's not in the register, set it
    if (currentValue && !register(name)?.value) {
      setValue(name, currentValue);
    }
  }, [currentValue, name, setValue, register]);

  // Handle value change - FIXED VERSION
  const handleChange = (value: string) => {
    // Always set the value, regardless of current value
    setValue(name, value);
    
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="p-3 rounded-sm">
      <div className="flex items-center w-full">
        <label className="text-gray-700 font-medium mr-4 w-32">{label}</label>
        <Select
          {...register(name)}
          value={currentValue || ""}
          onValueChange={handleChange}
        >
          <SelectTrigger className="">
            <SelectValue placeholder="Select an option">
              {currentValue
                ? options && options.find(option => option.value === currentValue)?.label || "Unknown Field"
                : "Select an option"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options && options.map((option) => (
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