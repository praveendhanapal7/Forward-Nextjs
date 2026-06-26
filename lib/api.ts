export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<unknown> {
  const { body, headers, method = "GET", ...rest } = options;

  const url = path.startsWith("http") ? path : path;

  const init: RequestInit = {
    method,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    ...rest,
  };

  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError(
      "Unable to reach the server right now. Please try again.",
      0,
    );
  }

  const data = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
      }
    }
    const message =
      (data && typeof data === "object" && (data as Record<string, string>).message) ||
      (typeof data === "string" && data) ||
      `Request failed (${response.status}).`;
    throw new ApiError(message as string, response.status, data);
  }

  return data;
}
