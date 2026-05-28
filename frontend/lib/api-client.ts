import { API_BASE_URL } from "@/lib/api-config";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text();
    }
    throw new ApiError(`Request failed: ${response.status}`, response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function registerUser(payload: {
  agency_id: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  rank?: string;
}): Promise<unknown> {
  return apiRequest("/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
