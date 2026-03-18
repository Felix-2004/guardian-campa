import { useState } from "react";
import { motion } from "framer-motion";
import { User, Moon, Sun, Phone, Copy, ExternalLink, Loader2, Type } from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("guardian_theme") === "dark");
  const [largeText, setLargeText] = useState(localStorage.getItem("guardian_a11y") === "large");
  const [prefs, setPrefs] = useState(user?.preferences || { routineReminders: true, safetyCheckIns: true, emergencyAlerts: true, sosDelay: 3 });
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.users.update({ name, preferences: prefs });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("guardian_theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const toggleLargeText = () => {
    const next = !largeText;
    setLargeText(next);
    localStorage.setItem("guardian_a11y", next ? "large" : "normal");
    document.documentElement.style.fontSize = next ? "18px" : "";
  };

  const copyFamilyLink = () => {
    if (!user?.familyToken) return;
    const url = `${window.location.origin}/family-dashboard?token=${user.familyToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar title="Profile & Settings" showBack backHref="/dashboard" />
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-[430px] mx-auto px-4 pt-4 pb-24">
        {/* Avatar */}
        <motion.div
          className="flex flex-col items-center py-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-3">
            <User className="w-10 h-10 text-primary" />
          </div>
          <p className="font-bold text-lg">{user?.name || "Guardian User"}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <Phone className="w-3.5 h-3.5" />
            {user?.phone}
          </p>
        </motion.div>

        {/* Edit name */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Display Name</label>
          <input
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary mb-3"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>

        {/* Appearance */}
        <div className="bg-card border border-border rounded-2xl divide-y divide-border mb-4">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              <span className="text-sm font-medium">Dark Mode</span>
            </div>
            <button onClick={toggleDark} className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Type className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Large Text (Accessibility)</span>
            </div>
            <button onClick={toggleLargeText} className={`w-12 h-6 rounded-full transition-colors relative ${largeText ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${largeText ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-card border border-border rounded-2xl mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">Notifications</p>
          {[
            { key: "routineReminders", label: "Routine Reminders" },
            { key: "safetyCheckIns", label: "Safety Check-ins" },
            { key: "emergencyAlerts", label: "Emergency Alerts" },
          ].map((item, i) => (
            <div key={item.key} className={`flex items-center justify-between px-4 py-3 ${i < 2 ? "border-b border-border" : ""}`}>
              <span className="text-sm font-medium">{item.label}</span>
              <button
                onClick={() => setPrefs((p: any) => ({ ...p, [item.key]: !p[item.key] }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${prefs[item.key as keyof typeof prefs] ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[item.key as keyof typeof prefs] ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
          ))}
          <div className="px-4 py-3">
            <label className="text-sm font-medium block mb-2">SOS Hold Duration: {prefs.sosDelay}s</label>
            <input
              type="range"
              min={1}
              max={10}
              value={prefs.sosDelay}
              onChange={e => setPrefs((p: any) => ({ ...p, sosDelay: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Family Dashboard */}
        {user?.familyToken && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-4">
            <p className="font-semibold text-sm mb-1">Family Dashboard</p>
            <p className="text-xs text-muted-foreground mb-3">Share this link with family so they can monitor your safety</p>
            <div className="flex gap-2">
              <button onClick={copyFamilyLink} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium">
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <a
                href={`/family-dashboard?token=${user.familyToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-muted rounded-xl text-sm font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open
              </a>
            </div>
          </div>
        )}

        {/* Stealth mode */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <p className="font-semibold text-sm mb-1">Stealth Mode</p>
          <p className="text-xs text-muted-foreground mb-3">Disguise the app as a calculator. Type "999=" to trigger SOS.</p>
          <a href="/stealth" className="flex items-center justify-center gap-2 py-2.5 bg-muted rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground">
            Open Stealth Mode
          </a>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3.5 text-destructive border border-destructive/30 rounded-2xl text-sm font-semibold hover:bg-destructive/5"
        >
          Sign Out
        </button>
      </div>
      </div>
      <BottomNav />
    </div>
  );
}
