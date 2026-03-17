import { Link, useLocation } from "wouter";
import { Home, MapPin, Users, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import SosButton from "./SosButton";

const tabs = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/locations", icon: MapPin, label: "Locations" },
  { path: "/contacts", icon: Users, label: "Contacts" },
  { path: "/alerts", icon: Bell, label: "Alerts" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="max-w-[430px] mx-auto flex items-end justify-around px-2 pb-2 pt-2">
        {tabs.slice(0, 2).map(tab => (
          <Link key={tab.path} href={tab.path}>
            <button className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
              location === tab.path || location.startsWith(tab.path)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}>
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          </Link>
        ))}

        <div className="flex flex-col items-center -mt-6">
          <SosButton />
          <span className="text-[10px] font-bold text-destructive mt-0.5">SOS</span>
        </div>

        {tabs.slice(2).map(tab => (
          <Link key={tab.path} href={tab.path}>
            <button className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
              location === tab.path || location.startsWith(tab.path)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}>
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
