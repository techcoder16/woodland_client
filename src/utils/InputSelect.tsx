import React, { useEffect, useRef } from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';

interface SelectFieldProps {
  label: string;
  name: string;
  options: any[];
  register: UseFormRegister<FieldValues>;
  error?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;  // onChange handler
}

const InputSelect: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  register,
  error,
  defaultValue = '',
  onChange,
}) => {

  const inputRef = useRef<HTMLInputElement>(null);

  // Handler for select and input field changes
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    if (onChange) {
      onChange(event.target.value); // Call the onChange prop if it exists
    }
  };

  useEffect(() => {
    const handleAutofillEvent = () => {
      const value = inputRef.current?.value;
      if (onChange && value !== undefined) {
        onChange(value); // Trigger onChange for autofill values
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener("change", handleAutofillEvent);
      input.addEventListener("input", handleAutofillEvent); // Handles modern autofill scenarios
    }

    return () => {
      if (input) {
        input.removeEventListener("change", handleAutofillEvent);
        input.removeEventListener("input", handleAutofillEvent);
      }
    };
  }, [onChange]);

  return (
    <div className="p-3 rounded-sm">
      <div className="flex items-center space-x-4"> {/* Updated layout using flex */}
        {/* Input Field on Left */}
        <label className="text-gray-700 font-medium mr-4">{label}</label>
        <Input
          className="p-2 border border-gray-300 rounded w-32"
          {...register(name)} // Use name directly for the input field
          defaultValue={defaultValue}
          placeholder=""
          ref={inputRef} // Attach ref to the input
          onChange={handleChange}  // Pass onChange for the input field
        />

        {/* Select Field on Right */}
        <div className="flex-grow">
          <select
            className="p-2 border border-gray-300 rounded w-full"
            {...register(name)} // Use name directly for the select field
            defaultValue={defaultValue}
            onChange={handleChange}  // Pass onChange for the select field
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
      {error && <p className="text-red-500 mt-1 mx-2 justify-center flex">{error}</p>}
    </div>
  );
};

export default InputSelect;
