// Woodland works in the UK, so the country on landlord / property / occupier
// forms is locked to United Kingdom. An admin can unlock it in Settings →
// General. The choice is stored in this browser.
const KEY = "woodland.countryUnlocked";

export const isCountryUnlocked = (): boolean => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const setCountryUnlocked = (unlocked: boolean) => {
  try {
    if (unlocked) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — stays locked */
  }
};

const UK = { value: "GB", label: "\u{1F1EC}\u{1F1E7} United Kingdom" };
const OTHER_CODES = ["IE", "FR", "DE", "ES", "IT", "PT", "NL", "BE", "CH", "SE", "NO", "DK", "FI", "PL", "RO", "GR", "TR", "AE", "SA", "QA", "IN", "PK", "BD", "CN", "HK", "SG", "MY", "JP", "AU", "NZ", "ZA", "NG", "KE", "EG", "US", "CA", "MX", "BR"];

export const countryOptions = (unlocked: boolean) => {
  if (!unlocked) return [UK];
  let name: (code: string) => string = (c) => c;
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    name = (c) => dn.of(c) || c;
  } catch {
    /* fall back to the code */
  }
  return [UK, ...OTHER_CODES.map((c) => ({ value: c, label: name(c) })).sort((a, b) => a.label.localeCompare(b.label))];
};
