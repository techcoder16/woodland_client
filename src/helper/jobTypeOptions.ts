// Mirrors woodland-server-nest/src/property-management/job-type-options.ts —
// keep both lists in sync if changed.
export const JOB_TYPE_OPTIONS = [
  "Plumbing",
  "Electrical",
  "Heating/Cooling (HVAC)",
  "Appliance",
  "Doors & Windows",
  "Roofing",
  "Flooring",
  "Walls/Ceilings",
  "Pest Control",
  "Landscaping",
  "Security",
  "Cleaning",
  "Other",
] as const;

export const JOB_LOCATION_OPTIONS = [
  "Kitchen",
  "Bathroom",
  "Bedroom",
  "Living Room",
  "Hallway",
  "Garage",
  "Garden",
  "Roof",
  "Exterior",
  "Utility Room",
  "Other",
] as const;

export const JOB_SCHEDULE_OPTIONS = ["One-off", "Weekly", "Monthly", "Yearly"] as const;
