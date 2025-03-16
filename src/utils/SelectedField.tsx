
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
 
  useEffect(() => {
    
    if (defaultValue) {
     
      setValue(name, defaultValue);
    }
  }, [defaultValue, name, setValue]);

  // Handle value change
  const handleChange = (value: string) => {
    if(name == "country" )
      {
    
      }
      if (currentValue )
      { 
    setValue(name, value); // Manually update form state
      }

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
        value={currentValue || ""} onValueChange={handleChange}
     
        
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
