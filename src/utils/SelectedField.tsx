import React from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';

interface SelectFieldProps {
  label: string;
  name: string;
  options: any[];
  register: UseFormRegister<FieldValues>;
  error?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;  // Add onChange callback as a prop
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  register,
  error,
  defaultValue = '',
  onChange,  // Destructure the onChange prop
}) => {

  // Handle the change event, if an onChange function is passed
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (onChange) {
      onChange(value);  // Call the passed onChange function with the selected value
    }
  };

  return (
    <div className="flex flex-col mb-4 mx-2 bg-[#F4F4F4] p-3 rounded-sm">
      <div className="flex items-center w-full">
        <label className="text-gray-700 font-medium mr-4 w-32">{label}</label>
        
        <select
          className="p-2 border border-gray-300 rounded flex w-full"
          {...register(name)} 
          defaultValue={defaultValue}
          onChange={handleChange}  // Attach the onChange handler
        >
          {defaultValue && <option value="">{defaultValue}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {error && <p className="text-red-500 mt-1 mx-2">{error}</p>}
    </div>
  );
};

export default SelectField;
