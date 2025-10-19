import React from "react";
import { UseFormRegister, UseFormWatch } from "react-hook-form";

interface EPCRatingSelectProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: string;
  watch: UseFormWatch<any>;
}

const EPCRatingSelect: React.FC<EPCRatingSelectProps> = ({
  label,
  name,
  register,
  error,
  watch,
}) => {
  const currentValue = watch(name);
  
  console.log(`🏷️ EPCRatingSelect [${name}] render:`, { currentValue });

  return (
    <div className="p-3 rounded-sm">
      <div className="space-y-2">
        <label className="text-gray-700 text-sm font-medium mr-4 w-32">{label}</label>
        
        <select
          {...register(name, {
            onChange: (e) => {
              console.log(`✏️ EPCRatingSelect [${name}] changed to:`, e.target.value);
            }
          })}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select a rating</option>
          {Array.from({ length: 101 }, (_, i) => (
            <option key={i} value={i.toString()}>
              {i}
            </option>
          ))}
        </select>
      </div>
      
      {error && <p className="text-red-500 mt-1 mx-2 justify-center flex">{error}</p>}
    </div>
  );
};

export default EPCRatingSelect;

