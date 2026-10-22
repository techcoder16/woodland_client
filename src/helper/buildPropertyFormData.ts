// File fields hold StoredFile ids (uploaded to S3 by FileUploadField). An
// empty value means "no file" and is sent as null so a removed photo clears.
const FILE_ID_FIELDS = new Set(["photographFileId", "floorPlanFileId"]);

/**
 * Serialises the flat property form into the JSON body the /properties POST
 * and PATCH endpoints expect. Scalars go as strings (the DTO validates them
 * as strings and parses numbers/booleans server side).
 */
export function buildPropertyPayload(data: Record<string, any>, isDraft: boolean): Record<string, any> {
  const payload: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === "propertyStatus" || key === "id") continue;

    if (key === "attachmentFileIds") {
      payload[key] = Array.isArray(value) ? value.filter((v) => typeof v === "string" && v) : [];
    } else if (key === "rooms") {
      let rooms = value;
      if (typeof value === "string") {
        try { rooms = JSON.parse(value); } catch { rooms = []; }
      }
      payload[key] = Array.isArray(rooms) ? rooms : [];
    } else if (FILE_ID_FIELDS.has(key)) {
      payload[key] = typeof value === "string" && value ? value : null;
    } else if (typeof value === "boolean" || typeof value === "number") {
      payload[key] = String(value);
    } else if (typeof value === "string") {
      payload[key] = value;
    }
  }

  payload.propertyStatus = isDraft ? "DRAFT" : "PUBLISHED";
  return payload;
}
