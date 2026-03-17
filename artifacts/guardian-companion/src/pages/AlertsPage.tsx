import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCircle, MapPin, Clock, Loader2 } from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { api } from "@/lib/api";

function formatTime(s: string) {
  return new Date(s).toLocaleString();
}

function typeLabel(t: string) {
  return t === "sos" ? "SOS Alert" : t === "check_in" ? "Check-In" : "Routine Violation";
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await api.alerts.list();
      setAlerts(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleResolve = async (id: number) => {
    setResolving(id);
    try {
      await api.alerts.resolve(id);
      await load();
    } catch {}
    setResolving(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Alerts" />
      <div className="max-w-[430px] mx-auto px-4 pt-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-card border border-border rounded-2xl animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No alerts</p>
            <p className="text-sm mt-1">Your alert history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                className={`bg-card border rounded-2xl p-4 ${alert.status === "active" ? "border-destructive/40" : "border-border"}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${alert.status === "active" ? "bg-destructive animate-pulse" : "bg-muted-foreground"}`} />
                    <div>
                      <p className="font-bold text-sm">{typeLabel(alert.type)}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatTime(alert.createdAt)}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${alert.status === "active" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                    {alert.status}
                  </span>
                </div>

                {alert.lat && alert.lng && (
                  <a
                    href={`https://maps.google.com/?q=${alert.lat},${alert.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary mb-3"
                  >
                    <MapPin className="w-3 h-3" />
                    View location on map
                  </a>
                )}

                {alert.trackingSessionId && (
                  <a
                    href={`/track/${alert.trackingSessionId}`}
                    className="text-xs text-primary mb-3 block"
                  >
                    📡 Live tracking link →
                  </a>
                )}

                {alert.resolvedAt && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Resolved: {formatTime(alert.resolvedAt)}
                  </p>
                )}

                {alert.status === "active" && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolving === alert.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium w-full justify-center"
                  >
                    {resolving === alert.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Mark as Resolved — I'm Safe
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
