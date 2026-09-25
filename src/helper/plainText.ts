/**
 * Renders note/description text that may carry HTML from legacy or imported
 * rows. These fields are authored in plain textareas, so the HTML is never
 * intentional — and injecting it with dangerouslySetInnerHTML would be an XSS
 * hole. Tags are stripped to readable text instead.
 *
 * Block-level tags become newlines so multi-paragraph notes stay readable;
 * use `collapseWhitespace` for single-line contexts such as table cells.
 */
export function plainText(value: unknown, options?: { collapseWhitespace?: boolean }): string {
  const text = String(value ?? "");
  if (!text) return "";

  const decoded = (text.includes("<") ? text : text)
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  if (options?.collapseWhitespace) {
    return decoded.replace(/\s+/g, " ").trim();
  }
  return decoded.replace(/\n{3,}/g, "\n\n").trim();
}
