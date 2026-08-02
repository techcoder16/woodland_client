/**
 * Serialises a flat property form JSON into a multipart FormData payload
 * ready for the /properties POST and PATCH endpoints.
 */
export function buildPropertyFormData(data: Record<string, any>, isDraft: boolean): FormData {
  const formData = new FormData();
  const propertyStatus = isDraft ? "DRAFT" : "PUBLISHED";

  for (const [key, value] of Object.entries(data)) {
    if (key === "propertyStatus") continue;

    if (key === "attachments" && Array.isArray(value)) {
      value.forEach((file: any, index: number) => {
        if (file) formData.append(`attachments[${index}]`, file);
      });
    } else if (key === "rooms") {
      let roomsValue = value;
      if (typeof value === "string") {
        try { roomsValue = JSON.parse(value); } catch { roomsValue = []; }
      }
      formData.append("rooms", JSON.stringify(Array.isArray(roomsValue) ? roomsValue : []));
    } else if (typeof value === "boolean") {
      formData.append(key, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  }

  formData.append("propertyStatus", propertyStatus);
  return formData;
}
