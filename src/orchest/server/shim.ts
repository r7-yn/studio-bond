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
// Gemini-style schema type names, included in the JSON instruction sent to the model.
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
/** Server-side Google Gemini REST client; API handlers retain their deterministic fallbacks on error. */
export function createGeminiAiClient() {
  return {
    models: {
      async generateContent({ model, contents, config }: GenerateArgs): Promise<{ text: string }> {
        const key = process.env["GEMINI_API_KEY"]?.trim();
        if (!key) throw new Error("GEMINI_API_KEY missing");
        const modelId =
          process.env["GEMINI_MODEL"]?.trim() ||
          (model === "gemini-3.8-flash" ? "gemini-flash-latest" : model || "gemini-flash-latest");
        const schemaNote = config?.responseSchema
          ? `\n\nأجب بصيغة JSON فقط وفق هذا المخطط:\n${JSON.stringify(config.responseSchema)}`
          : "";
        const requestBody = {
          ...(config?.systemInstruction
            ? { systemInstruction: { parts: [{ text: config.systemInstruction }] } }
            : {}),
          contents: [{ role: "user", parts: [{ text: contents + schemaNote }] }],
          generationConfig: {
            ...(typeof config?.temperature === "number" ? { temperature: config.temperature } : {}),
            ...(config?.responseMimeType ? { responseMimeType: config.responseMimeType } : {}),
          },
        };
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`,
          {
            method: "POST",
            headers: { "X-goog-api-key": key, "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          },
        );
        if (!response.ok) {
          throw new Error(
            `Gemini API ${response.status}: ${(await response.text()).slice(0, 500)}`,
          );
        }
        const data = (await response.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text =
          data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
        if (!text) throw new Error("Gemini API returned no text content");
        return { text: text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim() };
      },
    },
  };
}
