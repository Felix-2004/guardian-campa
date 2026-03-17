import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Mic, MicOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { queueSos, isOnline } from "@/lib/offline";

const HOLD_DURATION = 3000;

export default function SosButton() {
  const { user } = useAuth();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sosResult, setSosResult] = useState<any>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);

  const cleanup = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    setHolding(false);
    setProgress(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
    } catch {
      // Audio permission denied - continue without recording
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    setRecording(false);
  };

  const triggerSos = async () => {
    setTriggered(true);
    setOverlayVisible(true);
    
    // Vibrate
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    await startRecording();

    let lat = 0, lng = 0;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      lat = 0;
      lng = 0;
    }

    if (!isOnline()) {
      queueSos(lat, lng, "SOS triggered offline");
      return;
    }

    try {
      const result = await api.alerts.triggerSos({ lat, lng });
      setSosResult(result);
    } catch {
      queueSos(lat, lng);
    }

    setTimeout(() => {
      stopRecording();
      setOverlayVisible(false);
      setTriggered(false);
      setSosResult(null);
    }, 8000);
  };

  const handlePressStart = () => {
    setHolding(true);
    const start = Date.now();
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setProgress(pct);
    }, 30);

    holdTimer.current = setTimeout(() => {
      cleanup();
      triggerSos();
    }, HOLD_DURATION);
  };

  const handlePressEnd = () => {
    cleanup();
  };

  useEffect(() => () => cleanup(), []);

  return (
    <>
      <AnimatePresence>
        {overlayVisible && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-red-600/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-white text-6xl font-black mb-4"
            >
              🚨
            </motion.div>
            <p className="text-white text-2xl font-bold mb-2">SOS SENT!</p>
            {sosResult && (
              <p className="text-white/80 text-sm mb-4">
                {sosResult.contactsNotified} contact(s) notified
              </p>
            )}
            {recording && (
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Mic className="w-4 h-4 animate-pulse" />
                Recording...
              </div>
            )}
            <motion.div className="mt-4 text-white/60 text-xs">
              Screen closes automatically in 8s
            </motion.div>
            <button
              onClick={() => { setOverlayVisible(false); setTriggered(false); stopRecording(); }}
              className="mt-6 px-6 py-2 bg-white/20 rounded-full text-white text-sm"
            >
              I'm Safe - Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-center">
        {/* Progress ring */}
        {holding && (
          <svg className="absolute w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke="rgba(220,38,38,0.3)"
              strokeWidth="4"
            />
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke="rgb(220,38,38)"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-none"
            />
          </svg>
        )}

        <motion.button
          className={`w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg ${!holding ? "sos-pulse" : ""}`}
          onPointerDown={handlePressStart}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          whileTap={{ scale: 0.92 }}
          style={{ touchAction: "none", userSelect: "none" }}
        >
          <AlertTriangle className="w-7 h-7 text-white" />
        </motion.button>
      </div>
    </>
  );
}
