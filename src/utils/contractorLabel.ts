// The contractor record used when the landlord arranges their own contractor
// ("Landlord Contractor") is shown as "Landlord assigned" everywhere.
export const contractorLabel = (name?: string | null): string => {
  if (!name) return "";
  return /^landlord(\s+contractor)?$/i.test(name.trim()) ? "Landlord assigned" : name;
};
