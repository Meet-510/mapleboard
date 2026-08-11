import { config } from "../config.js";

export type FetchOpts = {
  timeoutMs?: number;
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "HEAD";
  body?: string;
};

export async function httpFetch(url: string, opts: FetchOpts = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? config.network.fetchTimeoutMs
  );

  try {
    return await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        "User-Agent": config.network.userAgent,
        Accept: "application/json, text/xml, */*",
        ...opts.headers,
      },
      body: opts.body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJson<T>(url: string, opts: FetchOpts = {}): Promise<T> {
  const res = await httpFetch(url, opts);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

export async function fetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  const res = await httpFetch(url, opts);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return await res.text();
}
