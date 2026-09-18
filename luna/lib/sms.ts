import { phoneToSmsRu } from "@/lib/phone";

export async function sendSms(phone: string, text: string): Promise<{ ok: true; dev?: boolean } | { ok: false; error: string }> {
  const apiId = process.env.SMSRU_API_ID?.trim();
  if (!apiId) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[SMS DEV]", phone, text);
      return { ok: true, dev: true };
    }
    return { ok: false, error: "SMS-шлюз не настроен" };
  }

  const to = phoneToSmsRu(phone);
  const url = `https://sms.ru/sms/send?api_id=${encodeURIComponent(apiId)}&to=${encodeURIComponent(to)}&msg=${encodeURIComponent(text)}&json=1`;
  const res = await fetch(url);
  const data = await res.json().catch(() => null) as { status?: string; status_text?: string } | null;
  if (!res.ok || data?.status !== "OK") {
    return { ok: false, error: data?.status_text || "Не удалось отправить SMS" };
  }
  return { ok: true };
}
