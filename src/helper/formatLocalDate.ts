// Formats a Date as YYYY-MM-DD using its LOCAL calendar date, never UTC.
// date.toISOString() converts to UTC first, which silently shifts the date
// backward by one day for any user east of UTC picking a date near midnight
// (e.g. picking 18 Aug in the UK during BST stores as 17 Aug) — this avoids
// that shift by reading getFullYear/getMonth/getDate directly.
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
