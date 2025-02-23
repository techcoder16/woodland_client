import React, { useEffect } from "react";
import {
  FieldValues,
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  FieldError,
} from "react-hook-form";
import { Input } from "@/components/ui/input";

interface SelectFieldProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  register: UseFormRegister<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  error?: FieldError;
  defaultValue?: string;
  rules?: Record<string, any>;
  className?: string;
}

const InputSelect: React.FC<SelectFieldProps> = ({
  label,
  name,
  options,
  register,
  watch,
  setValue,
  error,
  defaultValue = "",
  rules = {},
  className = "",
}) => {
  const inputFieldName = `${name}_input`;
  const selectFieldName = `${name}_select`;

  // Register input and select fields
  const { ref: inputRef, ...inputRest } = register(inputFieldName);
  const { ref: selectRef, ...selectRest } = register(selectFieldName);

  // Register main field for validation
  const { ref: mainRef, ...mainRest } = register(name, rules);
  
  // Watch both fields
  const inputValue = watch(inputFieldName) || "";
  const selectValue = watch(selectFieldName) || "";

  // Combine values into the main field
  useEffect(() => {
    const combinedValue = `${inputValue}-${selectValue}`.trim();
 
    setValue(name, combinedValue, { shouldValidate: true });
  }, [inputValue, selectValue, setValue, name]);

  // Set default values on mount
  useEffect(() => {
    if (defaultValue) {
      const match = defaultValue.match(/(\d+)(%\D+)/);
      if (match) {
        setValue(inputFieldName, match[1]);
        setValue(selectFieldName, match[2]);
      }
    }
  }, [defaultValue, setValue, inputFieldName, selectFieldName]);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div className="flex gap-2">
        {/* Text Input */}
        <Input
          {...inputRest}
          ref={(e) => {
            inputRef(e);
            // @ts-ignore
            mainRef(e?.querySelector ? null : e); // Connect to main ref
          }}
          value={inputValue}
          onChange={(e) => setValue(inputFieldName, e.target.value)}
          className="w-1/3"
          aria-invalid={error ? "true" : "false"}
        />

        {/* Select Dropdown */}
        <select
          {...selectRest}
          ref={(e) => {
            selectRef(e);
            // @ts-ignore
            mainRef(e?.querySelector ? null : e); // Connect to main ref
          }}
          value={selectValue}
          onChange={(e) => setValue(selectFieldName, e.target.value)}
          className="w-2/3 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-invalid={error ? "true" : "false"}
        >
          <option value="">Select unit...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Hidden input for form validation */}
        <input type="hidden" {...mainRest} ref={mainRef} />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm mt-1" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default InputSelect;