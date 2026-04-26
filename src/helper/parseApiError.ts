export function parseApiError(error: any, fallback: string): string {
  if (error.response?.data) {
    const { message, error: errField } = error.response.data;
    if (Array.isArray(message)) {
      return message.map((err: any) =>
        err.property && err.constraints
          ? `${err.property}: ${Object.values(err.constraints).join(", ")}`
          : JSON.stringify(err)
      ).join("\n");
    }
    if (message) return message;
    if (errField) return errField;
  }
  return error.message ?? fallback;
}
