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

const InputSelect: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  register,
  error,
  defaultValue = ''
}) => (
  <div className="lg:flex lg:flex-col mb-4 mx-2 bg-[#F4F4F4] p-3 rounded-sm">
    <div className="lg:flex items-center lg:w-full">
      {/* Input Field on Left */}
      <label className="text-gray-700 font-medium mr-4 lg:w-32">{label}</label>
      <input
        className="p-2 border border-gray-300 rounded lg:w-32 mr-4"
        {...register(`${name}.input`)} // Assume name.input for the input field
        defaultValue={defaultValue}
        placeholder=""
      />

      {/* Select Field on Right */}
      <div className="flex lg:w-1/3 lg:mt-0 mt-2">
        <select
          className="p-2 border border-gray-300 rounded flex-grow"
          {...register(`${name}.select`)} // Assume name.select for the select field
          defaultValue={defaultValue}
        >
          {defaultValue && <option value="">{defaultValue}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
    {error && <p className="text-red-500 mt-1 mx-2">{error}</p>}
  </div>
);

export default InputSelect;
