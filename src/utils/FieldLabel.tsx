// Renders a form field label, coloring a trailing " *" (required marker) red.
export function renderLabel(label: string) {
  if (label.endsWith("*")) {
    return (
      <>
        {label.slice(0, -1).trimEnd()} <span className="text-destructive">*</span>
      </>
    );
  }
  return label;
}
