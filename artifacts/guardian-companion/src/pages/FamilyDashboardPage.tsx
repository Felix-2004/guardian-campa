import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, MapPin, Bell, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

export default function FamilyDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setError("No access token provided");
      setLoading(false);
      return;
    }
    api.family.dashboard(token)
      .then(d => setData(d))
      .catch(() => setError("Invalid or expired access token"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 text-center">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <p className="font-semibold text-lg mb-2">Access Denied</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[hsl(222,47%,11%)] to-[hsl(215,60%,18%)] px-4 py-6 text-white">
        <div className="max-w-[430px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6" />
            <span className="font-bold text-lg">Guardian Companion</span>
          </div>
          <p className="text-white/60 text-sm">Family Safety Dashboard</p>
        </div>
      </div>

      <div className="max-w-[430px] mx-auto px-4 py-6 space-y-4">
        {/* User info */}
        <motion.div
          className="bg-card border border-border rounded-2xl p-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs text-muted-foreground mb-1">Monitoring</p>
          <p className="font-bold text-xl">{data.user.name || "Guardian User"}</p>
          <p className="text-sm text-muted-foreground">{data.user.phone}</p>
        </motion.div>

        {/* Live tracking */}
        {data.isTracking && data.trackingSessionId && (
          <motion.div
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-red-500">Active Emergency!</span>
            </div>
            <a
              href={`/track/${data.trackingSessionId}`}
              className="block w-full text-center py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold"
            >
              📡 View Live Location
            </a>
          </motion.div>
        )}

        {/* Latest alert */}
        {data.latestAlert && (
          <motion.div
            className="bg-card border border-border rounded-2xl p-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Latest Alert</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium capitalize">{data.latestAlert.type.replace("_", " ")}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${data.latestAlert.status === "active" ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"}`}>
                {data.latestAlert.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{new Date(data.latestAlert.createdAt).toLocaleString()}</p>
            {data.latestAlert.lat && (
              <a href={`https://maps.google.com/?q=${data.latestAlert.lat},${data.latestAlert.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary mt-2">
                <MapPin className="w-3 h-3" /> View location
              </a>
            )}
          </motion.div>
        )}

        {/* Recent alerts */}
        <div>
          <h2 className="font-bold text-base mb-3">Alert History</h2>
          {data.recentAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No alerts recorded</p>
          ) : (
            <div className="space-y-2">
              {data.recentAlerts.map((alert: any, i: number) => (
                <div key={alert.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.status === "active" ? "bg-destructive" : "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{alert.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="text-xs capitalize text-muted-foreground">{alert.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
