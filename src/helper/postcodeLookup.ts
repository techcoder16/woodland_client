export interface PostcodeAddress {
  line1: string;
  line2: string;
  town: string;
  county: string;
  postcode: string;
}

interface GetAddressIoSuggestion {
  address: string;
}

interface GetAddressIoResponse {
  addresses: string[];
}

/**
 * Looks up a UK postcode via getAddress.io and returns candidate addresses.
 * Requires VITE_GETADDRESS_API_KEY to be set; without it, lookups no-op.
 */
export async function lookupPostcode(postcode: string): Promise<PostcodeAddress[]> {
  const apiKey = import.meta.env.VITE_GETADDRESS_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GETADDRESS_API_KEY is not set — postcode lookup is disabled.");
    return [];
  }

  const cleaned = postcode.trim();
  if (!cleaned) return [];

  const response = await fetch(
    `https://api.getAddress.io/find/${encodeURIComponent(cleaned)}?api-key=${apiKey}&expand=true`
  );

  if (!response.ok) {
    throw new Error(`Postcode lookup failed (${response.status})`);
  }

  const data: GetAddressIoResponse = await response.json();

  return (data.addresses || []).map((line: string) => {
    const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
    return {
      line1: parts[0] || "",
      line2: parts[1] || "",
      town: parts[parts.length - 2] || "",
      county: parts[parts.length - 1] || "",
      postcode: cleaned,
    };
  });
}
