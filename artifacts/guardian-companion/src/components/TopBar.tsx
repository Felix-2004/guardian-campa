import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Settings, ChevronLeft } from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export default function TopBar({ title, showBack, backHref }: TopBarProps) {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <Link href={backHref || "/dashboard"}>
            <button className="p-1 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
        )}
        <div>
          {title ? (
            <h1 className="font-bold text-lg">{title}</h1>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{getGreeting()},</p>
              <h1 className="font-bold text-base leading-tight">{user?.name || "Guardian"}</h1>
            </>
          )}
        </div>
      </div>
      <Link href="/profile">
        <button className="p-2 rounded-xl hover:bg-muted transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </Link>
    </div>
  );
}
