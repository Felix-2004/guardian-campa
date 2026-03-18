import { Link, useLocation } from "wouter";
import { Home, MapPin, Users, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import SosButton from "./SosButton";

const leftTabs = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/locations", icon: MapPin, label: "Locations" },
];

const rightTabs = [
  { path: "/contacts", icon: Users, label: "Contacts" },
  { path: "/alerts", icon: Bell, label: "Alerts" },
];

export default function BottomNav() {
  const [location] = useLocation();

  const isActive = (path: string) =>
    location === path || location.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="max-w-[430px] mx-auto flex items-end justify-around px-2 pb-2 pt-2">
        {leftTabs.map(tab => (
          <Link key={tab.path} href={tab.path}>
            <button className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
              isActive(tab.path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
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

        {rightTabs.map(tab => (
          <Link key={tab.path} href={tab.path}>
            <button className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
              isActive(tab.path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
