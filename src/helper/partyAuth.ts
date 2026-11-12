import axios from "axios";
import { DEFAULT_COOKIE_GETTER, DEFAULT_COOKIE_SETTER, DEFAULT_COOKIE_DELETE, AUTH_COOKIE_DAYS } from "./Cookie";

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

  await DEFAULT_COOKIE_SETTER(cookieKey(kind, "access_token"), data.access_token, false, AUTH_COOKIE_DAYS);
  await DEFAULT_COOKIE_SETTER(cookieKey(kind, "refresh_token"), data.refresh_token, false, AUTH_COOKIE_DAYS);

  const party = data[kind];
  await DEFAULT_COOKIE_SETTER(cookieKey(kind, "party"), JSON.stringify(party), false, AUTH_COOKIE_DAYS);

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

// Unauthenticated — no token exists yet when a password is being reset.
export async function partyForgotPassword(kind: PartyKind, email: string): Promise<void> {
  await axios.post(`${API_URL}auth/${kind}/forgot-password`, { email });
}

export async function partyResetPassword(kind: PartyKind, token: string, password: string): Promise<void> {
  await axios.post(`${API_URL}auth/${kind}/reset-password`, { token, password });
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

const LOGIN_PATH: Record<PartyKind, string> = {
  vendor: "/landlord/login",
  tenant: "/tenant/login",
  contractor: "/contractor/login",
};

const inflight: Partial<Record<PartyKind, Promise<boolean>>> = {};

/**
 * Swaps the party's refresh token for a new access token. Only a real rejection
 * of the refresh token ends the session; a network blip just fails this call.
 */
export function partyRefresh(kind: PartyKind): Promise<boolean> {
  if (inflight[kind]) return inflight[kind]!;
  inflight[kind] = (async () => {
    try {
      const refresh = await DEFAULT_COOKIE_GETTER(cookieKey(kind, "refresh_token"));
      if (!refresh) return false;
      const { data } = await axios.post(`${API_URL}auth/${kind}/refresh`, {}, { headers: { Authorization: `Bearer ${refresh}` } });
      const access = data.accessToken || data.access_token;
      const newRefresh = data.refreshToken || data.refresh_token;
      if (!access) return false;
      await DEFAULT_COOKIE_SETTER(cookieKey(kind, "access_token"), access, false, AUTH_COOKIE_DAYS);
      if (newRefresh) await DEFAULT_COOKIE_SETTER(cookieKey(kind, "refresh_token"), newRefresh, false, AUTH_COOKIE_DAYS);
      return true;
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 400 || status === 401 || status === 403) {
        await DEFAULT_COOKIE_DELETE(cookieKey(kind, "access_token"));
        await DEFAULT_COOKIE_DELETE(cookieKey(kind, "refresh_token"));
        await DEFAULT_COOKIE_DELETE(cookieKey(kind, "party"));
        window.location.href = LOGIN_PATH[kind];
      }
      return false;
    } finally {
      delete inflight[kind];
    }
  })();
  return inflight[kind]!;
}

// Authenticated GET/POST helpers scoped to a party's own token. A 401 (the
// 1-day access token ran out) refreshes the token and retries once, so a
// portal left open or idle stays signed in.
async function partyRequest<T>(kind: PartyKind, run: (token: string | null) => Promise<{ data: T }>): Promise<T> {
  try {
    return (await run(await getPartyAccessToken(kind))).data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401 && (await partyRefresh(kind))) {
      return (await run(await getPartyAccessToken(kind))).data;
    }
    throw error;
  }
}

export function partyGet<T>(kind: PartyKind, path: string): Promise<T> {
  return partyRequest<T>(kind, (token) => axios.get(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } }));
}

export function partyPost<T>(kind: PartyKind, path: string, body: object): Promise<T> {
  return partyRequest<T>(kind, (token) => axios.post(`${API_URL}${path}`, body, { headers: { Authorization: `Bearer ${token}` } }));
}
