import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, Plus, Trash2, Edit2, X, Loader2 } from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { api } from "@/lib/api";

const priorityBadge = (p: string) =>
  p === "primary"
    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
    : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", relationship: "", priority: "secondary" as "primary" | "secondary" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await api.contacts.list();
      setContacts(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "", relationship: "", priority: "secondary" });
    setShowForm(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, relationship: c.relationship, priority: c.priority });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.relationship) return;
    setSaving(true);
    try {
      if (editing) {
        await api.contacts.update(editing.id, form);
      } else {
        await api.contacts.create(form);
      }
      await load();
      setShowForm(false);
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this contact?")) return;
    await api.contacts.delete(id);
    await load();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar title="Emergency Contacts" showBack backHref="/dashboard" />
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-[430px] mx-auto px-4 pt-4 pb-24">
        <button
          onClick={openAdd}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-2xl font-semibold text-sm mb-5"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-card border border-border rounded-2xl animate-pulse" />)}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Phone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No contacts yet</p>
            <p className="text-sm mt-1">Add emergency contacts above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c, i) => (
              <motion.div
                key={c.id}
                className="bg-card border border-border rounded-2xl p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-base">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.relationship}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${priorityBadge(c.priority)}`}>
                    {c.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{c.phone}</p>
                <div className="flex gap-2">
                  <a href={`tel:${c.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/10 text-green-600 rounded-xl text-sm font-medium dark:text-green-400">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <a href={`sms:${c.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/10 text-blue-600 rounded-xl text-sm font-medium dark:text-blue-400">
                    <MessageCircle className="w-3.5 h-3.5" /> Message
                  </a>
                  <button onClick={() => openEdit(c)} className="px-3 py-2 bg-muted rounded-xl text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="px-3 py-2 bg-destructive/10 text-destructive rounded-xl">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
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
              className="relative bg-card rounded-t-3xl p-6 w-full max-w-[430px] pb-10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg">{editing ? "Edit Contact" : "Add Contact"}</h3>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Phone number" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                <input className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Relationship" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} />
                <div className="flex gap-2">
                  {(["primary", "secondary"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors capitalize ${form.priority === p ? "bg-primary text-white border-primary" : "bg-background border-border"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.phone || !form.relationship}
                className="w-full mt-5 bg-primary text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Contact"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
      <BottomNav />
    </div>
  );
}
