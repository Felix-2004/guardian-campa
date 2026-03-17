import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, MapPin, Users, Bell, User, Settings, AlertCircle } from 'lucide-react';
import { SOSButton } from './SOSButton';
import { useAuth } from '@/lib/auth-context';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const isStealth = location === '/stealth';
  if (isStealth) return <div className="app-container">{children}</div>;

  return (
    <div className="app-container flex flex-col">
      {/* Top Bar */}
      <header className="px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-30 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <AlertCircle className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg text-primary tracking-tight">Guardian</span>
        </div>
        <Link href="/profile" className="p-2 -mr-2 rounded-full hover:bg-accent text-muted-foreground transition-colors">
          <Settings className="w-5 h-5" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar pb-24">
        {children}
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 w-full max-w-[430px] bg-background border-t border-border shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-40 pb-safe">
        <div className="flex justify-between items-center px-6 py-3 relative h-[72px]">
          <NavItem href="/" icon={<Home />} label="Home" active={location === '/'} />
          <NavItem href="/locations" icon={<MapPin />} label="Map" active={location === '/locations'} />
          
          {/* Spacer for SOS Button */}
          <div className="w-16" />
          <SOSButton />

          <NavItem href="/contacts" icon={<Users />} label="Contacts" active={location === '/contacts'} />
          <NavItem href="/alerts" icon={<Bell />} label="Alerts" active={location === '/alerts'} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex flex-col items-center gap-1 min-w-[48px] transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'
      }`}
    >
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-primary/10 scale-110' : 'bg-transparent'}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}
