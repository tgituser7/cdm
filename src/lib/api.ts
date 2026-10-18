/** The Express API (backend folder). The website calls it directly, with credentials. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");

const TOKEN_KEY = "cdm.session";

/**
 * Fallback for browsers that block the cross-site session cookie (Safari/iOS, private windows):
 * the backend also returns the signed session id at sign-in, and we send it as a Bearer header.
 * The session itself still lives in MongoDB; signing out destroys it.
 */
export const sessionToken = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  /** `remember` keeps it across browser restarts, like the "Keep me signed in" cookie. */
  set(token: string, remember: boolean) {
    try {
      this.clear();
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable: the cookie alone has to do
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

/** Headers that authenticate a request: the session cookie goes automatically, the token as a fallback. */
export function authHeaders(): Record<string, string> {
  const token = sessionToken.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/** JSON request to the API with the session attached. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...authHeaders(),
        ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new ApiError("Can't reach the server. It may be waking up, please try again in a few seconds.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong", res.status, data.fields);
  return data as T;
}

/** Resolve a stored image path to a loadable URL. */
export function imageUrl(src: string) {
  return src.startsWith("/res/") ? `${API_URL}${src}` : src;
}

/** onError handler for decorative images: hide a missing file and show the brand gradient behind it instead. */
export function hideBrokenImage(e: { currentTarget: HTMLImageElement }) {
  e.currentTarget.style.visibility = "hidden";
  e.currentTarget.parentElement?.classList.add("brand-gradient");
}
