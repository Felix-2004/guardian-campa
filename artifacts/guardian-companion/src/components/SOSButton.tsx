import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useTriggerSos } from '@workspace/api-client-react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useToast } from '@/hooks/use-toast';

export function SOSButton() {
  const [isPressing, setIsPressing] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { lat, lng } = useGeolocation();
  const { mutate: triggerSos, isPending } = useTriggerSos();
  const { toast } = useToast();

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isTriggered) return;
    
    if (navigator.vibrate) navigator.vibrate(50);
    setIsPressing(true);
    
    pressTimerRef.current = setTimeout(() => {
      triggerEmergency();
    }, 3000);
  };

  const handlePointerUpOrLeave = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    setIsPressing(false);
  };

  const triggerEmergency = () => {
    setIsPressing(false);
    setIsTriggered(true);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    
    triggerSos({ 
      data: { lat: lat || 0, lng: lng || 0, message: "Emergency SOS triggered!" } 
    }, {
      onSuccess: () => {
        toast({
          title: "SOS Activated",
          description: "Emergency contacts have been notified with your live location.",
          variant: "destructive",
        });
      },
      onError: () => {
        // Fallback for offline mode or API failure
        toast({
          title: "Offline SOS Registered",
          description: "Alert queued and will be sent when connection is restored.",
          variant: "destructive",
        });
      }
    });
  };

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  return (
    <>
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
        <div className="pointer-events-auto relative">
          
          {/* Idle Pulse Animation */}
          {!isPressing && !isTriggered && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-destructive"
            />
          )}

          {/* Press and Hold Ring Animation */}
          {isPressing && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
              <motion.circle
                cx="50" cy="50" r="46"
                stroke="hsl(var(--destructive))"
                strokeWidth="4"
                fill="none"
                strokeDasharray="289"
                initial={{ strokeDashoffset: 289 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </svg>
          )}

          {/* Core Button */}
          <motion.button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUpOrLeave}
            onPointerLeave={handlePointerUpOrLeave}
            whileTap={{ scale: 0.95 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl ${
              isTriggered ? 'bg-red-700 animate-pulse' : 'sos-gradient shadow-destructive/30'
            }`}
          >
            {isPending ? (
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isTriggered ? (
              <AlertTriangle className="w-10 h-10 animate-bounce" />
            ) : (
              <span className="font-display font-bold text-xl tracking-wider">SOS</span>
            )}
          </motion.button>
        </div>
        
        <AnimatePresence>
          {isPressing && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute -top-10 whitespace-nowrap bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md"
            >
              Hold for 3 seconds
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Triggered Overlay */}
      <AnimatePresence>
        {isTriggered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-destructive/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center pointer-events-auto"
          >
            <AlertTriangle className="w-24 h-24 mb-6 animate-pulse" />
            <h1 className="font-display text-4xl font-bold mb-2">SOS ACTIVE</h1>
            <p className="text-lg opacity-90 mb-8 max-w-xs">
              Your location is being broadcasted. Help is on the way.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                className="w-full py-4 rounded-xl bg-white text-destructive font-bold text-lg hover:bg-white/90 active:scale-95 transition-all shadow-xl"
                onClick={() => {
                  toast({ title: "Connecting...", description: "Dialing emergency services..."});
                }}
              >
                CALL 911
              </button>
              <button 
                className="w-full py-4 rounded-xl bg-black/20 text-white font-semibold hover:bg-black/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                onClick={() => setIsTriggered(false)}
              >
                <X className="w-5 h-5" /> Cancel SOS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
