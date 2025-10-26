import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export const DateField = ({
  label,
  value,
  onChange,
  error,
  placeholder = "Pick a date",
}: {
  label: string;
  value: string;
  onChange: (date: Date) => void;
  error?: string;
  placeholder?: string;
}) => (
  <div className="space-y-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (() => {
            const date = new Date(value);
            return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
          })() : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={date => date && onChange(date)}
          initialFocus
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);
