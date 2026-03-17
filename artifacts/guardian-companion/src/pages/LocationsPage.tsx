import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Trash2, X, Loader2 } from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pickedPos, setPickedPos] = useState<[number, number] | null>(null);
  const [label, setLabel] = useState("");
  const [radius, setRadius] = useState(100);
  const [saving, setSaving] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  const load = async () => {
    try {
      const data = await api.locations.list();
      setLocations(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    navigator.geolocation.getCurrentPosition(pos => {
      setUserPos([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  const defaultCenter: [number, number] = userPos || [user?.homeLat || 40.7128, user?.homeLng || -74.0060];

  const handleSave = async () => {
    if (!pickedPos || !label.trim()) return;
    setSaving(true);
    try {
      await api.locations.create({ label: label.trim(), lat: pickedPos[0], lng: pickedPos[1], radius });
      await load();
      setShowForm(false);
      setPickedPos(null);
      setLabel("");
      setRadius(100);
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this location?")) return;
    await api.locations.delete(id);
    await load();
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Safe Locations" />
      <div className="max-w-[430px] mx-auto pb-24">
        {/* Map */}
        <div className="h-[240px] border-b border-border">
          <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {userPos && <Marker position={userPos}><Popup>You are here</Popup></Marker>}
            {locations.map(loc => (
              <Circle key={loc.id} center={[loc.lat, loc.lng]} radius={loc.radius} color="#3b82f6" fillColor="#3b82f6" fillOpacity={0.15}>
                <Popup>{loc.label}</Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>

        <div className="px-4 pt-4">
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-2xl font-semibold text-sm mb-5"
          >
            <Plus className="w-4 h-4" />
            Add Safe Location
          </button>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-16 bg-card border border-border rounded-2xl animate-pulse" />)}
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No safe locations yet</p>
              <p className="text-sm mt-1">Add your home, school, or other safe places</p>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((loc, i) => (
                <motion.div
                  key={loc.id}
                  className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{loc.label}</p>
                    <p className="text-xs text-muted-foreground">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)} · {loc.radius}m radius</p>
                  </div>
                  <button onClick={() => handleDelete(loc.id)} className="p-2 text-destructive rounded-xl hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
            <motion.div
              className="relative bg-card rounded-t-3xl w-full max-w-[430px] pb-10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="flex items-center justify-between px-6 pt-6 mb-4">
                <h3 className="font-bold text-lg">Add Safe Location</h3>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
              </div>

              <p className="text-xs text-muted-foreground px-6 mb-2">Tap on the map to place your pin</p>
              <div className="h-[200px] mx-6 rounded-2xl overflow-hidden border border-border mb-4">
                <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapClickHandler onPick={(lat, lng) => setPickedPos([lat, lng])} />
                  {pickedPos && <Marker position={pickedPos}><Popup>Selected location</Popup></Marker>}
                </MapContainer>
              </div>

              <div className="px-6 space-y-3">
                <input
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="Label (e.g. Home, School)"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                />
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Radius: {radius}m</label>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={50}
                    value={radius}
                    onChange={e => setRadius(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !pickedPos || !label.trim()}
                  className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Location"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
