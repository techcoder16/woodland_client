// Turns any API error body into one readable string. Handles:
//  - NestJS/class-validator: { message: ["jobType must be one of…", …] } (or objects with property/constraints)
//  - FastAPI 422:            { detail: [{ loc: ["body","field"], msg: "…" }] }
//  - plain:                  { message: "…" } / { error: "…" } / "…"
export function extractApiMessage(data: any): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return data;

  const src = data.message ?? data.detail ?? data.error;
  if (Array.isArray(src)) {
    return src
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item?.property && item?.constraints) {
          return `${item.property}: ${Object.values(item.constraints).join(", ")}`;
        }
        if (item?.msg) {
          const field = Array.isArray(item.loc) ? item.loc.filter((p: any) => p !== "body").join(".") : "";
          return field ? `${field}: ${item.msg}` : item.msg;
        }
        return JSON.stringify(item);
      })
      .join("\n");
  }
  if (typeof src === "string") return src;
  return typeof data.error === "string" ? data.error : undefined;
}

export function parseApiError(error: any, fallback: string): string {
  return extractApiMessage(error?.response?.data) ?? error?.message ?? fallback;
}
