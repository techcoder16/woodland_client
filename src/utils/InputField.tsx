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
  onChange?: (value: string) => void;  
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = 'text',
  register,
  error,
  placeholder = '',
  onChange,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (onChange) {
      onChange(value);  // Call the passed onChange function with the selected value
    }
  };
  
 return (

  <div className="lg:flex lg:flex-col mb-4 mx-2 bg-[#F4F4F4] p-3 rounded-sm">
    <div className="lg:flex items-center lg:w-full">
      <label className="text-gray-700 font-medium mr-4 w-32">{label}</label>
      <input
        type={type}
        className="p-2 border border-gray-300 rounded lg:flex-grow"
        {...register(name)}
        placeholder={placeholder}
        onChange={handleChange}  // Attach the onChange handler

      />
    </div>
    {error && <p className="text-red-500 mt-1 mx-2">{error}</p>}
  </div>
 );

};


export default InputField;
