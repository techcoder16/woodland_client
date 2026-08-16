// InputField.tsx
import React from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { renderLabel } from './FieldLabel';
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
  <div className="space-y-1.5">
      <label className="font-medium text-muted-foreground text-sm">{renderLabel(label)}</label>
      <Textarea
        {...register(name)}
        placeholder={placeholder}
        onChange={handleChange}  // Attach the onChange handler
      />

    {error && <p className="text-destructive text-xs mt-1">{error}</p>}
  </div>
 );

};


export default InputField;
