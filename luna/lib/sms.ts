const API = "https://api.verificahub.ru";

function authHeader() {
  const key = process.env.VERIFICAHUB_API_KEY?.trim();
  const secret = process.env.VERIFICAHUB_API_SECRET?.trim();
  if (!key || !secret) return null;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

type Problem = { detail?: string; error_code?: string; attempts_remaining?: number };

async function vhRequest(path: string, body: object): Promise<
  { ok: true; data: Record<string, unknown> } | { ok: false; error: string; attempts?: number }
> {
  const auth = authHeader();
  if (!auth) return { ok: false, error: "Шлюз проверки номера не настроен" };

  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({})) as Record<string, unknown> & Problem;
  if (!res.ok) {
    return {
      ok: false,
      error: data.detail || "Ошибка SMS-шлюза",
      attempts: typeof data.attempts_remaining === "number" ? data.attempts_remaining : undefined,
    };
  }
  return { ok: true, data };
}

export type VerifyMethod = "sms" | "flash_call";

export async function startVerification(phone: string, method: VerifyMethod = "flash_call"): Promise<
  { ok: true; requestId: string; codeLength: number; method: VerifyMethod } | { ok: false; error: string }
> {
  const result = await vhRequest("/v1/verify", {
    phone_number: phone,
    method,
    expiry_seconds: 300,
  });
  if (!result.ok) return result;
  const requestId = String(result.data.request_id ?? "");
  if (!requestId) return { ok: false, error: "Шлюз не вернул идентификатор проверки" };
  return { ok: true, requestId, codeLength: Number(result.data.code_length ?? 4), method };
}

export async function checkSmsCode(requestId: string, code: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const result = await vhRequest("/v1/verify/check", { request_id: requestId, code });
  if (!result.ok) {
    const extra = result.attempts != null ? ` Осталось попыток: ${result.attempts}.` : "";
    return { ok: false, error: result.error + extra };
  }
  if (String(result.data.status ?? "") !== "verified") {
    return { ok: false, error: "Код не подтверждён" };
  }
  return { ok: true };
}
