// import React, { useEffect } from "react";
// import {
//   FieldValues,
//   UseFormRegister,
//   UseFormWatch,
//   UseFormSetValue,
//   FieldError,
// } from "react-hook-form";
// import { Input } from "@/components/ui/input";

// interface SelectFieldProps {
//   label: string;
//   name: string;
//   options: { value: string; label: string }[];
//   register: UseFormRegister<FieldValues>;
//   watch: UseFormWatch<FieldValues>;
//   setValue: UseFormSetValue<FieldValues>;
//   error?: FieldError;
//   defaultValue?: string;
//   rules?: Record<string, any>;
//   className?: string;
// }

// const InputSelect: React.FC<SelectFieldProps> = ({
//   label,
//   name,
//   options,
//   register,
//   watch,
//   setValue,
//   error,
//   defaultValue = "",
//   rules = {},
//   className = "",
// }) => {
//   const inputFieldName = `${name}_input`;
//   const selectFieldName = `${name}_select`;

//   const { ref: inputRef, ...inputRest } = register(inputFieldName);
//   const { ref: selectRef, ...selectRest } = register(selectFieldName);
//   const { ref: mainRef, ...mainRest } = register(name, rules);

//   const inputValue = watch(inputFieldName) || "";
//   const selectValue = watch(selectFieldName) || "";
// console.log(inputValue,selectValue)
//   useEffect(() => {
//     const combinedValue = `${inputValue}-${selectValue}`.trim();
//     setValue(name, combinedValue, { shouldValidate: true });
//   }, [inputValue, selectValue, setValue, name]);

//   useEffect(() => {
//     if (defaultValue) {
//       const match = defaultValue.match(/(\d+)(%\D+)/);
//       if (match) {
//         setValue(inputFieldName, match[1]);
//         setValue(selectFieldName, match[2]);
//       }
//     }
//   }, [defaultValue, setValue, inputFieldName, selectFieldName]);

//   return (
//     <div className={`lg:ml-4 flex items-center gap-2 ${className} my-2`}>
//       {/* Label */}
//       <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
//         {label}
//       </label>

//       {/* Input & Select Wrapper */}
//       <div className="flex gap-2">
//         {/* Text Input */}
//         <Input
//           {...inputRest}
//           ref={(e) => {
//             inputRef(e);
//             // @ts-ignore
//             mainRef(e?.querySelector ? null : e);
//           }}
//           value={inputValue}
//           onChange={(e) => setValue(inputFieldName, e.target.value)}
//           className=""
//           aria-invalid={error ? "true" : "false"}
//         />

//         {/* Select Dropdown */}
//         <select
//           {...selectRest}
//           ref={(e) => {
//             selectRef(e);
//             // @ts-ignore
//             mainRef(e?.querySelector ? null : e);
//           }}
//           value={selectValue}
//           onChange={(e) => setValue(selectFieldName, e.target.value)}
//           className=" border"
//           aria-invalid={error ? "true" : "false"}
//         >
//           <option value="">Select...</option>
//           {options.map((option) => (
//             <option key={option.value} value={option.value}>
//               {option.label}
//             </option>
//           ))}
//         </select>

//         {/* Hidden input for form validation */}
//         <input type="hidden" {...mainRest} ref={mainRef} />
//       </div>

//       {/* Error Message */}
//       {error && (
//         <p className="text-red-600 text-sm" role="alert">
//           {error.message}
//         </p>
//       )}
//     </div>
//   );
// };

// export default InputSelect;



import React, { useEffect } from "react";
import {
  FieldValues,
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  FieldError,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

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

  const { ref: inputRef, ...inputRest } = register(inputFieldName);
  const { ref: mainRef, ...mainRest } = register(name, rules);

  const inputValue = watch(inputFieldName) || "";
  const selectValue = watch(selectFieldName) || "";

  // Sync input values to the main hidden field
  useEffect(() => {
    const combinedValue = `${inputValue}-${selectValue}`.trim();
    setValue(name, combinedValue, { shouldValidate: true });
  }, [inputValue, selectValue, setValue, name]);

  // Handle default value correctly
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
    <div className={`lg:ml-4 flex items-center gap-2 ${className} my-2`}>
      {/* Label */}
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        {label}
      </label>

      {/* Input & Select Wrapper */}
      <div className="flex gap-2">
        {/* Text Input */}
        <Input
          {...inputRest}
          ref={(e) => {
            inputRef(e);
            // @ts-ignore
            mainRef(e?.querySelector ? null : e);
          }}
          value={inputValue}
          onChange={(e) => setValue(inputFieldName, e.target.value, { shouldValidate: true })}
          aria-invalid={error ? "true" : "false"}
        />

        {/* Custom Select Dropdown */}
        <Select
          onValueChange={(value) => {
            setValue(selectFieldName, value, { shouldValidate: true });
            setValue(name, `${inputValue}-${value}`.trim(), { shouldValidate: true });
          }}
          value={selectValue}
        >
          <SelectTrigger className="border">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Hidden input for form validation */}
        <input type="hidden" {...mainRest} ref={mainRef} value={`${inputValue}-${selectValue}`} />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};

export default InputSelect;
