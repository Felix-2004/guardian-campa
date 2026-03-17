import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { hasPendingQueue } from "@/lib/offline";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [pendingQueue, setPendingQueue] = useState(hasPendingQueue());

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      setPendingQueue(hasPendingQueue());
    };
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline && !pendingQueue) return null;

  return (
    <div className="offline-banner text-white text-xs px-4 py-2 flex items-center gap-2">
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
      {offline
        ? "Offline Mode Active – SOS will be queued until connection restored"
        : `Connection restored – syncing ${hasPendingQueue() ? "pending alerts..." : "done"}`}
    </div>
  );
}
