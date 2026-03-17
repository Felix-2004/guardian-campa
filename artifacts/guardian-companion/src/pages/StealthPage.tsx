import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

const STEALTH_CODE = "999=";

export default function StealthPage() {
  const [display, setDisplay] = useState("0");
  const [input, setInput] = useState("");
  const [sosSent, setSosSent] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const buttons = [
    ["7", "8", "9", "÷"],
    ["4", "5", "6", "×"],
    ["1", "2", "3", "−"],
    ["0", ".", "=", "+"],
  ];

  const handleKey = (key: string) => {
    let newInput = input + key;
    setInput(newInput);

    if (key === "=") {
      const newDisplay = evaluateDisplay(input);
      setDisplay(newDisplay);
      setInput("");
    } else {
      setDisplay(newInput);
    }

    if (newInput.endsWith(STEALTH_CODE)) {
      triggerStealth();
      setInput("");
      setDisplay("0");
    }
  };

  const evaluateDisplay = (expr: string): string => {
    try {
      const result = Function(`"use strict"; return (${expr.replace("×", "*").replace("÷", "/").replace("−", "-")})`)();
      return String(result);
    } catch {
      return "Error";
    }
  };

  const handleDisplayTap = () => {
    setTapCount(c => {
      const next = c + 1;
      if (next >= 3) {
        window.location.href = "/dashboard";
        return 0;
      }
      return next;
    });
    setTapTimer(prev => {
      if (prev) clearTimeout(prev);
      return setTimeout(() => setTapCount(0), 2000);
    });
  };

  const triggerStealth = async () => {
    setSosSent(true);
    if ("vibrate" in navigator) navigator.vibrate([300, 100, 300]);
    let lat = 0, lng = 0;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {}
    try {
      await api.alerts.triggerSos({ lat, lng, message: "Emergency triggered via stealth mode" });
    } catch {}
    setTimeout(() => setSosSent(false), 5000);
  };

  const clear = () => {
    setDisplay("0");
    setInput("");
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col select-none">
      <AnimatePresence>
        {sosSent && (
          <motion.div
            className="absolute top-4 left-4 right-4 bg-green-500 text-white text-center py-2 rounded-xl text-sm font-medium z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ✓ Emergency alert sent
          </motion.div>
        )}
      </AnimatePresence>

      {/* Display */}
      <div
        className="flex-1 flex flex-col justify-end px-6 py-8 cursor-pointer"
        onClick={handleDisplayTap}
      >
        <p className="text-zinc-500 text-right text-sm mb-2 h-6">{input}</p>
        <p className="text-white text-right font-light truncate" style={{ fontSize: display.length > 10 ? "2rem" : "3.5rem" }}>
          {display}
        </p>
      </div>

      {/* Buttons */}
      <div className="px-4 pb-8 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <button onClick={clear} className="col-span-2 bg-zinc-600 text-white rounded-2xl h-16 text-xl font-medium active:opacity-70 transition-opacity">AC</button>
          <button className="bg-zinc-600 text-white rounded-2xl h-16 text-2xl font-light active:opacity-70">±</button>
          <button onClick={() => handleKey("÷")} className="bg-amber-500 text-white rounded-2xl h-16 text-2xl font-light active:opacity-70">÷</button>
        </div>
        {buttons.map((row, i) => (
          <div key={i} className="grid grid-cols-4 gap-3">
            {row.map(key => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className={`rounded-2xl h-16 text-xl font-light active:opacity-70 transition-opacity ${
                  ["÷", "×", "−", "+", "="].includes(key)
                    ? "bg-amber-500 text-white"
                    : "bg-zinc-700 text-white"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
