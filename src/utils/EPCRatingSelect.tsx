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
    <div className="space-y-1.5">
      <label className="text-muted-foreground text-sm font-medium">{label}</label>

      <select
        {...register(name, {
          onChange: (e) => {
            console.log(`✏️ EPCRatingSelect [${name}] changed to:`, e.target.value);
          }
        })}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-muted-foreground/30 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Select a rating</option>
        {Array.from({ length: 101 }, (_, i) => (
          <option key={i} value={i.toString()}>
            {i}
          </option>
        ))}
      </select>

      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
};

export default EPCRatingSelect;

