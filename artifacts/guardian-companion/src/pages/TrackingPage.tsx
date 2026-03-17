import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Shield, Clock, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function TrackingPage() {
  const params = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.tracking.get(params.sessionId);
      setSession(data);
    } catch {
      setError("Tracking session not found or expired");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [params.sessionId]);

  const pathPoints: [number, number][] = (session?.pathHistory || []).map((p: any) => [p.lat, p.lng]);
  const currentPos: [number, number] | null = session?.currentLat && session?.currentLng
    ? [session.currentLat, session.currentLng]
    : pathPoints.length > 0 ? pathPoints[pathPoints.length - 1] : null;

  const mapCenter: [number, number] = currentPos || [40.7128, -74.0060];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-destructive px-4 py-4 text-white">
        <div className="max-w-[430px] mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold">Guardian Companion</p>
            <p className="text-xs text-white/70">Live Safety Tracking</p>
          </div>
          {session?.status === "active" && (
            <div className="ml-auto flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-semibold">LIVE</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[430px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 px-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="font-semibold text-lg mb-2">Session Not Found</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* Map */}
            <div className="h-[60vh]">
              <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {currentPos && (
                  <Marker position={currentPos}>
                    <Popup>Current location · {session?.userName || "User"}</Popup>
                  </Marker>
                )}
                {pathPoints.length > 1 && (
                  <Polyline positions={pathPoints} color="#ef4444" weight={3} opacity={0.7} />
                )}
              </MapContainer>
            </div>

            {/* Info */}
            <div className="px-4 py-5 space-y-4">
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold">{session?.userName || "User"}</p>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${session?.status === "active" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                    {session?.status === "active" ? "Active Emergency" : "Expired"}
                  </span>
                </div>

                {currentPos && (
                  <p className="text-xs text-muted-foreground mb-3">
                    📍 {currentPos[0].toFixed(4)}, {currentPos[1].toFixed(4)}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Started: {new Date(session?.createdAt).toLocaleString()}
                </div>
                {session?.expiresAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    Expires: {new Date(session?.expiresAt).toLocaleString()}
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Location updates every 5 seconds • {pathPoints.length} points recorded
              </p>

              {currentPos && (
                <a
                  href={`https://maps.google.com/?q=${currentPos[0]},${currentPos[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 bg-primary text-white rounded-2xl text-sm font-semibold"
                >
                  Open in Google Maps
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
