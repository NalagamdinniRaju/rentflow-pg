import { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router';
import { Building2, LayoutDashboard, LogOut, IndianRupee } from 'lucide-react';
import { useAuthStore } from '~/store/auth.store';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';

export default function ResidentLayout() {
  const { user, initialized, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (initialized) {
      if (!user) navigate('/login');
      else if (user.role !== 'RESIDENT') navigate('/login');
    }
  }, [user, initialized, navigate]);

  if (!initialized || !user || user.role !== 'RESIDENT') return null;

  const navItems = [
    { icon: LayoutDashboard, label: 'My Stay', path: '/resident' },
    { icon: IndianRupee, label: 'Payments', path: '/resident/payments' },
  ];

  return (
    /*
      h-screen + overflow-hidden on the root means the page itself never scrolls.
      Scrolling is handled inside ResidentDashboard via its own overflow-y-auto div.
    */
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 bg-[#0F172A] text-white flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-sm">Resident Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-semibold text-white uppercase border border-slate-700 shrink-0 text-sm">
              {user.name?.charAt(0) || 'R'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10 text-sm"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* ── Content area ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/*
          On mobile: zero padding, full bleed — the dashboard owns its dark header.
          On desktop: expand to a nice max-width.
        */}
        <div className="flex-1 overflow-hidden md:overflow-auto md:py-8 md:px-8">
          <div className="h-full md:h-auto md:max-w-4xl md:mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  );
}