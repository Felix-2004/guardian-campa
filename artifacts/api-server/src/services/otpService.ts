interface OtpRecord {
  otp: string;
  attempts: number;
  requestCount: number;
  firstRequest: number;
  expiresAt: number;
}

const otpStore = new Map<string, OtpRecord>();

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function canRequestOtp(phone: string): boolean {
  const record = otpStore.get(phone);
  if (!record) return true;

  const now = Date.now();
  if (now - record.firstRequest > RATE_WINDOW_MS) {
    otpStore.delete(phone);
    return true;
  }
  return record.requestCount < RATE_LIMIT;
}

export function createOtp(phone: string): string {
  const otp = generateOtp();
  const now = Date.now();
  const existing = otpStore.get(phone);

  otpStore.set(phone, {
    otp,
    attempts: 0,
    requestCount: existing ? existing.requestCount + 1 : 1,
    firstRequest: existing ? existing.firstRequest : now,
    expiresAt: now + OTP_EXPIRY_MS,
  });

  return otp;
}

export function verifyOtp(phone: string, otp: string): boolean {
  const record = otpStore.get(phone);
  if (!record) return false;

  const now = Date.now();
  if (now > record.expiresAt) {
    otpStore.delete(phone);
    return false;
  }

  if (record.otp === otp) {
    otpStore.delete(phone);
    return true;
  }

  record.attempts++;
  return false;
}

export function getExpiresIn(phone: string): number {
  const record = otpStore.get(phone);
  if (!record) return 0;
  return Math.max(0, Math.floor((record.expiresAt - Date.now()) / 1000));
}
