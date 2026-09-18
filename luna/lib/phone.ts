export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let phone = raw.trim();
  if (digits.length === 11 && digits.startsWith("8")) phone = "+7" + digits.slice(1);
  else if (digits.length === 11 && digits.startsWith("7")) phone = "+" + digits;
  else if (digits.length === 10) phone = "+7" + digits;
  return /^\+7\d{10}$/.test(phone) ? phone : null;
}

/** Маска +7 (XXX) XXX-XX-XX; с первой цифры уже стоит +7 ( */
export function formatRuPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (d.startsWith("7")) d = d.slice(1);
  d = d.slice(0, 10);
  let out = "+7 (";
  if (!d.length) return out;
  out += d.slice(0, Math.min(3, d.length));
  if (d.length < 3) return out;
  out += ") ";
  out += d.slice(3, Math.min(6, d.length));
  if (d.length < 6) return out;
  out += "-" + d.slice(6, Math.min(8, d.length));
  if (d.length < 8) return out;
  return out + "-" + d.slice(8, 10);
}
