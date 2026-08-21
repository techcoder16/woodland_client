// Fields whose value should always be either a base64 data: URI (a real
// uploaded file, converted client-side) or empty — never a raw File/FileList
// object. If one of those ever slips through as a non-string value, String()
// would silently serialise it as the literal text "[object FileList]"/
// "[object File]", which then gets stored and displayed as a broken
// attachment the user never actually uploaded. Guarded explicitly here so
// that can never reach the network request, regardless of how it happened
// upstream.
const FILE_DATA_URI_FIELDS = new Set([
  "photographs",
  "floorPlans",
  "epcCertificate",
  "gasCertificate",
  "electricityCertificate",
  "fireRiskAssessment",
  "insuranceCertificate",
  "emergencyLightingCertificate",
  "propertyLicense",
]);

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
    } else if (FILE_DATA_URI_FIELDS.has(key)) {
      if (typeof value === "string" && value.startsWith("data:")) {
        formData.append(key, value);
      } else if (value === "" || value === null || value === undefined) {
        // Explicitly cleared/never set — fine to omit.
      } else {
        console.error(
          `buildPropertyFormData: dropping invalid value for "${key}" — expected a data: URI string, got`,
          value,
        );
      }
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  }

  formData.append("propertyStatus", propertyStatus);
  return formData;
}
