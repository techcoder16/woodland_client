// InputField.tsx
import React from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  register: UseFormRegister<FieldValues>;
  error?: string;
  placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = 'text',
  register,
  error,
  placeholder = ''
}) => (
  <div className="flex flex-col mb-4 mx-2 bg-[#F4F4F4] p-3 rounded-sm">
    <div className="flex items-center w-full">
      <label className="text-gray-700 font-medium mr-4 w-32">{label}</label>
      <input
        type={type}
        className="p-2 border border-gray-300 rounded flex-grow"
        {...register(name)}
        placeholder={placeholder}
      />
    </div>
    {error && <p className="text-red-500 mt-1 mx-2">{error}</p>}
  </div>
);

export default InputField;
