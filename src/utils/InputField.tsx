import React, { useEffect, useRef } from "react";
import { FieldValues, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";

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
  type = "text",
  register,
  error,
  placeholder = "",
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (onChange) {
      onChange(value); // Call the passed onChange function with the selected value
    }
  };

  // Handle autofill changes
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
      <div className="flex items-center lg:w-full">
        <label className="text-gray-700 font-medium mr-4 w-32">{label}</label>
        <Input
          type={type}
          ref={inputRef} // Attach ref to the input
          className="p-2 border border-gray-300 rounded lg:flex-grow"
          {...register(name)}
          placeholder={placeholder}
          onChange={handleChange} // Attach the onChange handler
        />
      </div>
      {error && <p className="text-red-500 mt-1 mx-2 justify-center flex">{error}</p>}
    </div>
  );
};

export default InputField;
