import React, { useEffect } from "react";
import { UseFormRegister,UseFormWatch,UseFormSetValue } from "react-hook-form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface SelectFieldProps {
  label: string;
  name: string;
  options: { label: string; value: string }[]; 
  register: UseFormRegister<any>;  // Use react-hook-form register
  error?: string;
  setValue: UseFormSetValue<any>;

  defaultValue?: string;
  

  watch: UseFormWatch<any>; // Watch form values to sync state

  onChange?: (value: string) => void;  // Add onChange callback as a prop
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



  
  // Handle the value change
  const handleChange = (value: string) => {
    if (onChange) {
      console.log(value);
      onChange(value);  // Trigger the passed onChange function
    
    }
  };

  return (

    <div className="p-3 rounded-sm">
      <div className="flex items-center w-full">
        <label className="text-gray-700 font-medium mr-4 w-32">{label}</label>
        <Select
          {...register(name)}  // Register the field with react-hook-form
          // defaultValue={defaultValue}
          defaultValue={defaultValue || currentValue}
          
          onValueChange={handleChange}  // Trigger onChange on selection change
        >
          <SelectTrigger className="p-2 border border-gray-300 rounded flex w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
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
