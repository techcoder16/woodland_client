// InputField.tsx
import React from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
interface InputFieldProps {
  label: string;
  name: string;

  register: UseFormRegister<FieldValues>;
  error?: string;
  placeholder?: string;
  onChange?: (value: string) => void;  
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,

  register,
  error,
  placeholder = '',
  onChange,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (onChange) {
      onChange(value);  // Call the passed onChange function with the selected value
    }
  };
  
 return (

  <div className=" p-3 rounded-sm">
    <div className="flex items-center w-full">
      <label className="text-gray-700 font-medium mr-4 w-32">{label}</label>
      <Textarea 
     
        className=""
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
