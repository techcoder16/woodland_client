import React, { useEffect, useRef } from "react";
import { FieldValues, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { renderLabel } from "./FieldLabel";

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  error?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  max?: number;
  min?: number;
  step?: number | string;
  disabled?: boolean;
  helperText?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = "text",
  min = 0,
  register,
  setValue,
  error,
  placeholder = "",
  onChange,
  max = 100000000000,
  step,
  disabled = false,
  helperText,
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
    <div className="space-y-1.5">
      {label && <label className="text-muted-foreground font-medium text-sm">{renderLabel(label)}</label>}
      <Input
        type={type}
        ref={inputRef}
        {...register(name)}
        {...(type === "number" ? { min, max, step: step ?? "any" } : {})}
        placeholder={placeholder}
        disabled={disabled}
      />
      {helperText && !error && <p className="text-muted-foreground text-xs mt-1">{helperText}</p>}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
};

export default InputField;
