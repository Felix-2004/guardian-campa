import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { User, MapPin, Phone, Heart, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const ISSUES = [
  { id: "night travel", label: "Night Travel", emoji: "🌙" },
  { id: "harassment", label: "Harassment", emoji: "🛡️" },
  { id: "health issues", label: "Health Issues", emoji: "💊" },
  { id: "elderly safety", label: "Elderly Safety", emoji: "👴" },
  { id: "child safety", label: "Child Safety", emoji: "👶" },
];

const STEPS = ["Personal Info", "Health & Issues", "Emergency Contacts", "Location & Prefs"];

export default function SetupPage() {
  const [, navigate] = useLocation();
  const { login, user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [healthConcerns, setHealthConcerns] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [contacts, setContacts] = useState([{ name: "", phone: "", relationship: "", priority: "primary" as "primary" | "secondary" }]);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [homeLat, setHomeLat] = useState<number | null>(null);
  const [homeLng, setHomeLng] = useState<number | null>(null);
  const [prefs, setPrefs] = useState({
    routineReminders: true,
    safetyCheckIns: true,
    emergencyAlerts: true,
    sosDelay: 3,
  });

  const toggleIssue = (id: string) => {
    setSelectedIssues(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const enableLocation = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      setHomeLat(pos.coords.latitude);
      setHomeLng(pos.coords.longitude);
      setLocationEnabled(true);
    }, () => setError("Location permission denied"));
  };

  const addContact = () => {
    setContacts(prev => [...prev, { name: "", phone: "", relationship: "", priority: "secondary" }]);
  };
  const removeContact = (i: number) => setContacts(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    setError("");
    try {
      const validContacts = contacts.filter(c => c.name && c.phone && c.relationship);
      const result = await api.users.setup({
        name: name.trim(),
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
        healthConcerns: healthConcerns || undefined,
        issues: selectedIssues,
        homeLat: homeLat ?? undefined,
        homeLng: homeLng ?? undefined,
        preferences: prefs,
        contacts: validContacts,
      });
      login(localStorage.getItem("guardian_token")!, result);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[430px] mx-auto px-4 pt-12 pb-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="text-2xl font-black">{STEPS[step]}</h1>
          <div className="flex gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Full Name *</label>
                <input
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Age</label>
                <input
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="Your age"
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Gender (optional)</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Male", "Female", "Other"].map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${gender === g ? "bg-primary text-white border-primary" : "bg-card border-border text-foreground hover:border-primary"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Health Concerns (optional)</label>
                <textarea
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none h-24"
                  placeholder="e.g. diabetes, heart condition, allergies..."
                  value={healthConcerns}
                  onChange={e => setHealthConcerns(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Safety Concerns</label>
                <div className="space-y-2">
                  {ISSUES.map(issue => (
                    <button
                      key={issue.id}
                      onClick={() => toggleIssue(issue.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${selectedIssues.includes(issue.id) ? "bg-primary/10 border-primary text-primary" : "bg-card border-border hover:border-primary/50"}`}
                    >
                      <span className="text-xl">{issue.emoji}</span>
                      <span className="font-medium text-sm">{issue.label}</span>
                      {selectedIssues.includes(issue.id) && <span className="ml-auto text-primary">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Add people who will be alerted in emergencies.</p>
              {contacts.map((c, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase">Contact {i + 1}</span>
                    {i > 0 && (
                      <button onClick={() => removeContact(i)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="Name"
                    value={c.name}
                    onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                  />
                  <input
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="Phone number"
                    type="tel"
                    value={c.phone}
                    onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))}
                  />
                  <input
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="Relationship (e.g. Mom, Friend)"
                    value={c.relationship}
                    onChange={e => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, relationship: e.target.value } : x))}
                  />
                  <div className="flex gap-2">
                    {(["primary", "secondary"] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setContacts(prev => prev.map((x, idx) => idx === i ? { ...x, priority: p } : x))}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors capitalize ${c.priority === p ? "bg-primary text-white border-primary" : "bg-background border-border"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={addContact} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary/40 rounded-2xl text-primary text-sm font-medium hover:bg-primary/5">
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">Home Location</p>
                    <p className="text-xs text-muted-foreground">Save your home as a safe zone</p>
                  </div>
                  <button
                    onClick={enableLocation}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${locationEnabled ? "bg-green-500/20 text-green-500" : "bg-primary text-white"}`}
                  >
                    {locationEnabled ? "✓ Saved" : "Enable"}
                  </button>
                </div>
                {locationEnabled && homeLat && (
                  <p className="text-xs text-muted-foreground">
                    📍 {homeLat.toFixed(4)}, {homeLng?.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notifications</p>
                {[
                  { key: "routineReminders", label: "Routine Reminders" },
                  { key: "safetyCheckIns", label: "Safety Check-ins" },
                  { key: "emergencyAlerts", label: "Emergency Alerts" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
                    <span className="text-sm font-medium">{item.label}</span>
                    <button
                      onClick={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${prefs[item.key as keyof typeof prefs] ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[item.key as keyof typeof prefs] ? "left-6" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3.5 rounded-2xl border border-border text-sm font-semibold"
            >
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => { if (step === 0 && !name.trim()) { setError("Name is required"); return; } setError(""); setStep(s => s + 1); }}
              className="flex-1 bg-primary text-white py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-primary text-white py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Setup 🎉"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
