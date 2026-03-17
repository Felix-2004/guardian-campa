let twilioClient: any = null;

function getTwilioClient() {
  if (!twilioClient && process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require("twilio");
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  }
  return twilioClient;
}

export async function sendSms(to: string, body: string): Promise<boolean> {
  const client = getTwilioClient();
  if (!client || !process.env.TWILIO_PHONE) {
    console.log(`[SMS MOCK] To: ${to} | Body: ${body}`);
    return true;
  }

  try {
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE,
      to,
    });
    return true;
  } catch (err) {
    console.error("[SMS ERROR]", err);
    return false;
  }
}

export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  const body = `Your Guardian Companion verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  return sendSms(phone, body);
}

export async function sendSosAlert(
  to: string,
  userName: string,
  lat: number,
  lng: number,
  trackingUrl: string,
  message?: string
): Promise<boolean> {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const body = `🚨 EMERGENCY ALERT from ${userName}! They need help.\nLocation: ${mapsLink}\nLive tracking: ${trackingUrl}${message ? `\nMessage: ${message}` : ""}\nPlease respond immediately!`;
  return sendSms(to, body);
}
