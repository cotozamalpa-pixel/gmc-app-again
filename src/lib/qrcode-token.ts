import crypto from 'crypto';

// The daily QR code encodes {cityId, date} signed with an HMAC so it
// cannot be forged or reused for a different day/city, but does NOT
// encode which student is checking in — the student scans it while
// logged into their own account, and the /api/attendance/checkin
// route records the check-in against the currently authenticated user.
// This means a photo of the QR shared in a group chat is harmless
// (each student still checks in under their own account) while a
// forged/altered code is rejected by the signature check.

function secret() {
  const s = process.env.QR_SIGNING_SECRET;
  if (!s) throw new Error('QR_SIGNING_SECRET is not set');
  return s;
}

export function signQrPayload(cityId: string, dateISO: string) {
  const payload = `${cityId}.${dateISO}`;
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('hex').slice(0, 24);
  return `${payload}.${sig}`;
}

export function verifyQrToken(token: string): { cityId: string; date: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [cityId, date, sig] = parts;
  const expected = crypto.createHmac('sha256', secret()).update(`${cityId}.${date}`).digest('hex').slice(0, 24);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return { cityId, date };
}
