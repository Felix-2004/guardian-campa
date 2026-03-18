import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Shield, AlertTriangle, CheckCircle, Users, MapPin, Bell, TrendingUp, ChevronRight } from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function DashboardPage() {
  const { user } = useAuth();
  const [safetyScore, setSafetyScore] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [score, recs, contactsData, alertsData, locsData] = await Promise.all([
          api.safety.score(),
          api.safety.recommendations(),
          api.contacts.list(),
          api.alerts.list(),
          api.locations.list(),
        ]);
        setSafetyScore(score);
        setRecommendations(recs.slice(0, 3));
        setContacts(contactsData);
        setAlerts(alertsData.slice(0, 3));
        setLocations(locsData);
      } catch {}
      setLoading(false);
    }
    load();

    navigator.geolocation.getCurrentPosition(pos => {
      setUserPos([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  const activeAlerts = alerts.filter(a => a.status === "active");
  const safetyStatus = activeAlerts.length > 0 ? "Emergency" : safetyScore?.riskLevel === "high" ? "Warning" : "Safe";
  const statusColor = safetyStatus === "Emergency" ? "text-destructive" : safetyStatus === "Warning" ? "text-yellow-500" : "text-green-500";
  const statusBg = safetyStatus === "Emergency" ? "bg-red-500/10 border-red-500/30" : safetyStatus === "Warning" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30";

  const defaultCenter: [number, number] = userPos || [user?.homeLat || 40.7128, user?.homeLng || -74.0060];

  const scoreColor = !safetyScore ? "#6b7280" : safetyScore.score >= 80 ? "#22c55e" : safetyScore.score >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar />
      <OfflineBanner />

      <div className="flex-1 overflow-y-auto">
      <div className="max-w-[430px] mx-auto pb-24">
        {/* Safety Status + Score */}
        <div className="px-4 pt-4 grid grid-cols-2 gap-3">
          <motion.div
            className={`rounded-2xl border p-4 ${statusBg}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-1">
              {safetyStatus === "Safe" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className={`w-4 h-4 ${statusColor}`} />}
              <span className="text-xs font-semibold text-muted-foreground">Status</span>
            </div>
            <p className={`text-xl font-black ${statusColor}`}>{safetyStatus}</p>
          </motion.div>

          <motion.div
            className="rounded-2xl border bg-card p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Safety Score</span>
            </div>
            {loading ? (
              <div className="h-7 bg-muted rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black" style={{ color: scoreColor }}>
                  {safetyScore?.score ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            )}
            <span className="text-xs font-medium capitalize" style={{ color: scoreColor }}>
              {safetyScore?.riskLevel || ""} risk
            </span>
          </motion.div>
        </div>

        {/* Map */}
        <motion.div
          className="mx-4 mt-4 rounded-2xl overflow-hidden border border-border shadow-sm"
          style={{ height: 220 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {userPos && (
              <Marker position={userPos}>
                <Popup>Your location</Popup>
              </Marker>
            )}
            {locations.map(loc => (
              <Circle
                key={loc.id}
                center={[loc.lat, loc.lng]}
                radius={loc.radius}
                color="#3b82f6"
                fillColor="#3b82f6"
                fillOpacity={0.15}
              >
                <Popup>{loc.label}</Popup>
              </Circle>
            ))}
          </MapContainer>
        </motion.div>

        {/* Quick stats */}
        <div className="px-4 mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: Users, label: "Contacts", value: contacts.length, href: "/contacts" },
            { icon: MapPin, label: "Safe Zones", value: locations.length, href: "/locations" },
            { icon: Bell, label: "Active", value: activeAlerts.length, href: "/alerts" },
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <motion.div
                className="bg-card border border-border rounded-2xl p-3 text-center hover:border-primary/50 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <item.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-black">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="px-4 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base">Recommendations</h2>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={rec.id}
                  className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${rec.priority === "high" ? "bg-destructive" : rec.priority === "medium" ? "bg-yellow-500" : "bg-green-500"}`} />
                  <div>
                    <p className="font-semibold text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <div className="px-4 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base">Recent Alerts</h2>
              <Link href="/alerts">
                <button className="text-xs text-primary font-medium flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.status === "active" ? "bg-destructive" : "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{alert.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.status === "active" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                    {alert.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety score factors */}
        {safetyScore?.factors?.length > 0 && (
          <div className="px-4 mt-5 mb-4">
            <h2 className="font-bold text-base mb-3">Risk Factors</h2>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              {safetyScore.factors.map((f: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-500 mt-0.5">⚠</span>
                  <span className="text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>

      <BottomNav />
    </div>
  );
}
