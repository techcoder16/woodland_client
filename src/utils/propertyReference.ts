export function formatPropertyReference(propertyNumber?: number | null) {
  if (propertyNumber === undefined || propertyNumber === null) return "-"; // no reference number yet
  const digits = String(Math.max(0, propertyNumber)).padStart(8, "0");
  return `0-${digits.slice(0, 4)}-${digits.slice(4)}`;
}
