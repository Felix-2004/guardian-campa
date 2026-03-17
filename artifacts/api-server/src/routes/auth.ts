import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RequestOtpBody, VerifyOtpBody } from "@workspace/api-zod";
import { canRequestOtp, createOtp, verifyOtp, getExpiresIn } from "../services/otpService.js";
import { sendOtp } from "../services/smsService.js";
import { generateToken } from "../middleware/auth.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();

router.post("/request-otp", async (req, res) => {
  const parsed = RequestOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid phone number" });
    return;
  }

  const { phone } = parsed.data;

  if (!canRequestOtp(phone)) {
    res.status(429).json({ error: "rate_limit", message: "Too many OTP requests. Please wait 10 minutes." });
    return;
  }

  const otp = createOtp(phone);
  await sendOtp(phone, otp);
  const expiresIn = getExpiresIn(phone);

  res.json({ success: true, message: "OTP sent successfully", expiresIn });
});

router.post("/verify-otp", async (req, res) => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid request data" });
    return;
  }

  const { phone, otp } = parsed.data;

  if (!verifyOtp(phone, otp)) {
    res.status(400).json({ error: "invalid_otp", message: "Invalid or expired OTP" });
    return;
  }

  let user = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).then(r => r[0]);

  if (!user) {
    const [newUser] = await db.insert(usersTable).values({
      phone,
      familyToken: crypto.randomUUID(),
      issues: [],
      profileCompleted: false,
      preferences: {
        routineReminders: true,
        safetyCheckIns: true,
        emergencyAlerts: true,
        sosDelay: 3,
      },
    }).returning();
    user = newUser;
  }

  const token = generateToken(user.id);

  res.json({
    token,
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400).json({ error: "missing_credential", message: "Google credential is required" });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(401).json({ error: "invalid_token", message: "Invalid Google token" });
      return;
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId)).then(r => r[0]);

    if (!user) {
      const [newUser] = await db.insert(usersTable).values({
        email,
        name: name || null,
        googleId,
        avatarUrl: picture || null,
        familyToken: crypto.randomUUID(),
        issues: [],
        profileCompleted: false,
        preferences: {
          routineReminders: true,
          safetyCheckIns: true,
          emergencyAlerts: true,
          sosDelay: 3,
        },
      }).returning();
      user = newUser;
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "google_auth_failed", message: "Google authentication failed" });
  }
});

export default router;
