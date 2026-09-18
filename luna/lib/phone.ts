export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let phone = raw.trim();
  if (digits.length === 11 && digits.startsWith("8")) phone = "+7" + digits.slice(1);
  else if (digits.length === 11 && digits.startsWith("7")) phone = "+" + digits;
  else if (digits.length === 10) phone = "+7" + digits;
  return /^\+7\d{10}$/.test(phone) ? phone : null;
}

export function phoneToSmsRu(phone: string) {
  return phone.replace(/\D/g, "").replace(/^8/, "7");
}
