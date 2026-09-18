const ACCESS_KEY = "guestToken";
const REFRESH_KEY = "guestRefreshToken";
const ID_KEY = "guestId";

let refreshInFlight: Promise<string | null> | null = null;

export function saveGuestSession(token: string, guestId: number | string, refreshToken?: string) {
  localStorage.setItem(ACCESS_KEY, token);
  localStorage.setItem(ID_KEY, String(guestId));
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearGuestSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ID_KEY);
}

export function guestAuthHeaders(extra?: HeadersInit) {
  const headers = new Headers(extra);
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function refreshGuestAccess(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;
    const res = await fetch("/api/auth/guest-refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearGuestSession();
      return null;
    }
    const data = await res.json();
    saveGuestSession(data.token, data.guest.id, data.refreshToken);
    return data.token as string;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function guestFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = guestAuthHeaders(init.headers);
  const res = await fetch(input, { ...init, headers });
  if (res.status !== 401) return res;
  const next = await refreshGuestAccess();
  if (!next) return res;
  headers.set("Authorization", `Bearer ${next}`);
  return fetch(input, { ...init, headers });
}
