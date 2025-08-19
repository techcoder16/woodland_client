import React, { useEffect, useRef } from "react";
import { FieldValues, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>; // React Hook Form's setValue
  error?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  max ?: number; // Optional max length for input

}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = "text",
  register,
  setValue,
  error,
  placeholder = "",
  onChange,
  max =100000000000,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleAutofill = () => {
      const value = inputRef.current?.value;
      if (value !== undefined) {
        setValue(name, value); // Update the form value in React Hook Form
        if (onChange) {
          onChange(value); // Call the optional onChange callback
        }
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener("change", handleAutofill);
      input.addEventListener("input", handleAutofill);
    }

    // Trigger autofill handling immediately on mount
    handleAutofill();

    return () => {
      if (input) {
        input.removeEventListener("change", handleAutofill);
        input.removeEventListener("input", handleAutofill);
      }
    };
  }, [name, setValue, onChange]);


  return (
    <div className="p-3 rounded-sm">
      <div className="space-y-2">

        <label className="text-gray-700 font-medium  text-sm mr-4 w-32">{label}</label>
        <Input
          type={type}
          ref={inputRef}
          className=""
          {...register(name)}
          {...(type === "number" ? { min: 0 } : {})}
          {...(type === "number" ? { max: max } : {})}
          
          placeholder={placeholder}
        />
      </div>
      {error && <p className="text-red-500 mt-1 mx-2 justify-center flex">{error}</p>}
    </div>
  );
};

export default InputField;
