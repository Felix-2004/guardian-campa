import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Shield, Phone, Lock, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.auth.requestOtp(phone.trim());
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.auth.verifyOtp(phone.trim(), otp.trim());
      login(result.token, result.user);
      if (!result.user.profileCompleted) {
        navigate("/setup");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(215,60%,15%)] flex flex-col items-center justify-center p-6">
      <motion.div
        className="w-full max-w-[390px]"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/40 flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white">Guardian</h1>
          <p className="text-white/50 text-sm mt-1">Your personal safety companion</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-6 border border-white/15">
          {step === "phone" ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl mb-1">Sign in</h2>
                <p className="text-white/50 text-sm">Enter your phone number to receive a code</p>
              </div>
              <div>
                <label className="block text-white/70 text-xs mb-2 font-medium">Phone Number</label>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 border border-white/20 focus-within:border-primary">
                  <Phone className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="bg-transparent text-white placeholder:text-white/30 text-sm flex-1 outline-none"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full bg-primary text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Code <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl mb-1">Enter Code</h2>
                <p className="text-white/50 text-sm">We sent a 6-digit code to {phone}</p>
              </div>
              <div>
                <label className="block text-white/70 text-xs mb-2 font-medium">Verification Code</label>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 border border-white/20 focus-within:border-primary">
                  <Lock className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="bg-transparent text-white placeholder:text-white/30 text-xl tracking-[0.5em] flex-1 outline-none font-mono"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full bg-primary text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button
                type="button"
                onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                className="w-full text-white/50 text-sm py-2"
              >
                Change phone number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Your safety data is encrypted and secure
        </p>
      </motion.div>
    </div>
  );
}
