import axios from "axios";
import { DEFAULT_COOKIE_GETTER, DEFAULT_COOKIE_SETTER, DEFAULT_COOKIE_DELETE } from "./Cookie";

export type PartyKind = "vendor" | "tenant" | "contractor";

const API_URL = import.meta.env.VITE_API_URL;

// Separate cookie namespace per party kind so a landlord/tenant/contractor
// session never collides with a concurrent staff session (or each other) in
// the same browser.
const cookieKey = (kind: PartyKind, name: "access_token" | "refresh_token" | "party") =>
  `${kind}_${name}`;

export interface PartyLoginResult {
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  party: any;
}

export async function partyLogin(kind: PartyKind, email: string, password: string): Promise<PartyLoginResult> {
  const response = await axios.post(`${API_URL}auth/${kind}/login`, { email, password });
  const data = response.data;

  await DEFAULT_COOKIE_SETTER(cookieKey(kind, "access_token"), data.access_token, false, 1);
  await DEFAULT_COOKIE_SETTER(cookieKey(kind, "refresh_token"), data.refresh_token, false, 30);

  const party = data[kind];
  await DEFAULT_COOKIE_SETTER(cookieKey(kind, "party"), JSON.stringify(party), false, 1);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    mustChangePassword: !!data.must_change_password,
    party,
  };
}

export async function getPartyAccessToken(kind: PartyKind): Promise<string | null> {
  return DEFAULT_COOKIE_GETTER(cookieKey(kind, "access_token"));
}

export async function getPartyInfo(kind: PartyKind): Promise<any | null> {
  const raw = await DEFAULT_COOKIE_GETTER(cookieKey(kind, "party"));
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

export async function partyChangePassword(kind: PartyKind, newPassword: string): Promise<void> {
  const token = await getPartyAccessToken(kind);
  await axios.post(
    `${API_URL}auth/${kind}/change-password`,
    { password: newPassword },
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export async function partyLogout(kind: PartyKind): Promise<void> {
  const token = await getPartyAccessToken(kind);
  try {
    if (token) {
      await axios.post(`${API_URL}auth/${kind}/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
    }
  } catch {
    // ignore — clear local cookies regardless of server response
  }
  await DEFAULT_COOKIE_DELETE(cookieKey(kind, "access_token"));
  await DEFAULT_COOKIE_DELETE(cookieKey(kind, "refresh_token"));
  await DEFAULT_COOKIE_DELETE(cookieKey(kind, "party"));
}

// Authenticated GET/POST helpers scoped to a party's own token — used by the
// minimal maintenance portal pages (list + create, both already scoped
// server-side by property.vendorId / PropertyParty for this caller).
export async function partyGet<T>(kind: PartyKind, path: string): Promise<T> {
  const token = await getPartyAccessToken(kind);
  const response = await axios.get(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
}

export async function partyPost<T>(kind: PartyKind, path: string, body: object): Promise<T> {
  const token = await getPartyAccessToken(kind);
  const response = await axios.post(`${API_URL}${path}`, body, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
}
