import React, { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthYearPickerProps {
  /** "Month Year", e.g. "August 2026" — matches the label format already used for accountingPeriod. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function parse(value: string): { month: string; year: number } {
  const [month, yearStr] = value.split(" ");
  const year = parseInt(yearStr, 10);
  return { month: MONTHS.includes(month) ? month : MONTHS[new Date().getMonth()], year: isNaN(year) ? new Date().getFullYear() : year };
}

// A calendar-picker for "accounting period" — this field is a month+year,
// not a specific day, so a full day-grid calendar would be the wrong
// control; this pairs a calendar-style trigger with month/year dropdowns.
export default function MonthYearPicker({ value, onChange, disabled }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const { month, year } = parse(value);
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled} className="w-full justify-start font-normal">
          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
          {value || "Select accounting period"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Select value={month} onValueChange={(m) => onChange(`${m} ${year}`)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(y) => onChange(`${month} ${y}`)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button size="sm" className="w-full" onClick={() => setOpen(false)}>Done</Button>
      </PopoverContent>
    </Popover>
  );
}
