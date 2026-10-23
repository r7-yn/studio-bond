// Minimal Express-like shim so the original server handlers run on the Worker unchanged.
type Handler = (req: ShimReq, res: ShimRes) => unknown;

export interface ShimReq {
  body: Record<string, unknown> | undefined;
  headers: { cookie?: string; [k: string]: string | undefined };
  query: URLSearchParams;
  params: Record<string, string>;
  header: (name: string) => string | undefined;
  ip: string;
  socket: { remoteAddress?: string };
}

export interface ShimRes {
  status: (code: number) => ShimRes;
  json: (data: unknown) => ShimRes;
  setHeader: (name: string, value: string) => void;
}

const routes = new Map<string, Handler>();

export const app = {
  get: (path: string, h: Handler) => routes.set(`GET ${path}`, h),
  post: (path: string, h: Handler) => routes.set(`POST ${path}`, h),
};

function findRoute(
  method: string,
  pathname: string,
): { handler: Handler; params: Record<string, string> } | null {
  const exact = routes.get(`${method} ${pathname}`);
  if (exact) return { handler: exact, params: {} };
  const pathParts = pathname.split("/").filter(Boolean);
  for (const [key, handler] of routes) {
    const separator = key.indexOf(" ");
    if (key.slice(0, separator) !== method) continue;
    const patternParts = key
      .slice(separator + 1)
      .split("/")
      .filter(Boolean);
    if (patternParts.length !== pathParts.length) continue;
    const params: Record<string, string> = {};
    let matches = true;
    for (let index = 0; index < patternParts.length; index++) {
      const pattern = patternParts[index] ?? "";
      const value = pathParts[index] ?? "";
      if (pattern.startsWith(":")) {
        try {
          params[pattern.slice(1)] = decodeURIComponent(value);
        } catch {
          matches = false;
          break;
        }
      } else if (pattern !== value) {
        matches = false;
        break;
      }
    }
    if (matches) return { handler, params };
  }
  return null;
}

export async function dispatch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const match = findRoute(request.method, url.pathname);
  if (!match) return Response.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown> | undefined;
  if (request.method !== "GET") {
    const text = await request.text();
    if (text.length > 256_000)
      return Response.json({ error: "Payload too large" }, { status: 413 });
    try {
      body = text ? (JSON.parse(text) as Record<string, unknown>) : undefined;
    } catch {
      body = undefined;
    }
  }
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
  const ip =
    headers["cf-connecting-ip"] || headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const req: ShimReq = {
    body,
    headers,
    query: url.searchParams,
    params: match.params,
    header: (n) => headers[n.toLowerCase()],
    ip,
    socket: { remoteAddress: ip },
  };

  let status = 200;
  let payload: unknown = null;
  const outHeaders = new Headers({ "content-type": "application/json" });
  const res: ShimRes = {
    status(code) {
      status = code;
      return res;
    },
    json(data) {
      payload = data;
      return res;
    },
    setHeader(name, value) {
      outHeaders.append(name, value);
    },
  };
  await match.handler(req, res);
  return new Response(JSON.stringify(payload), { status, headers: outHeaders });
}

// Gemini-style schema type names, converted to JSON Schema for the AI prompt.
export const Type = {
  OBJECT: "object",
  STRING: "string",
  NUMBER: "number",
  ARRAY: "array",
  BOOLEAN: "boolean",
  INTEGER: "integer",
} as const;

interface GenerateArgs {
  model?: string;
  contents: string;
  config?: {
    temperature?: number;
    responseSchema?: unknown;
    responseMimeType?: string;
    systemInstruction?: string;
  };
}

/** Replaces the Gemini SDK with the Lovable AI Gateway; returns null when no key so handlers use their fallbacks. */
export function createGatewayAiClient() {
  return {
    models: {
      async generateContent({ model, contents, config }: GenerateArgs): Promise<{ text: string }> {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) throw new Error("LOVABLE_API_KEY missing");
        const schemaNote = config?.responseSchema
          ? `\n\nأجب بصيغة JSON فقط وفق هذا المخطط:\n${JSON.stringify(config.responseSchema)}`
          : "";
        const messages = [
          ...(config?.systemInstruction
            ? [{ role: "system", content: config.systemInstruction }]
            : []),
          { role: "user", content: contents + schemaNote },
        ];
        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: `google/${model ?? "gemini-3.8-flash"}`,
            messages,
            temperature: config?.temperature,
            response_format: config?.responseSchema ? { type: "json_object" } : undefined,
          }),
        });
        if (!r.ok) throw new Error(`AI gateway ${r.status}: ${await r.text()}`);
        const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
        const text = data.choices?.[0]?.message?.content ?? "";
        return { text: text.replace(/^```(?:json)?\s*|\s*```$/g, "") };
      },
    },
  };
}
