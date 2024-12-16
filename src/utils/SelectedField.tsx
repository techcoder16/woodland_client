// SelectField.tsx
import React from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';

interface SelectFieldProps {
  label: string;
  name: string;
  options: any[];
  register: UseFormRegister<FieldValues>;
  error?: string;
  defaultValue?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  register,
  error,
  defaultValue = ''
}) => (
  <div className="flex flex-col mb-4 mx-2 bg-[#F4F4F4] p-3 rounded-sm">
    <div className="flex items-center w-full">
      <label className="text-gray-700 font-medium mr-4 w-32">{label}</label>
      <select className="p-2 border border-gray-300 rounded flex w-full" {...register(name)} defaultValue={defaultValue}>
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

export default SelectField;
