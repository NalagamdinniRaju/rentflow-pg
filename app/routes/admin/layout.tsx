import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router';
import {
  Building2, Users, IndianRupee, Receipt, Bell, BarChart3, Settings,
  LogOut, LayoutDashboard, Menu, X, ChevronLeft, ChevronRight, Tags,
  Eye, CornerUpLeft, Search, Building
} from 'lucide-react';
import { useAuthStore } from '~/store/auth.store';
import { useSuperAdminStore } from '~/store/super-admin.store';
import { useAllBuildings } from '~/queries/buildings.query';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select';

export default function AdminLayout() {
  const { user, initialized, signOut } = useAuthStore();
  const { selectedBuildingId, isImpersonating, setSelectedBuildingId, setImpersonating } = useSuperAdminStore();
  const { data: allBuildings = [] } = useAllBuildings();

  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (initialized) {
      if (!user) navigate('/login');
      else if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') navigate('/login');
    }
  }, [user, initialized, navigate]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (!initialized || !user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return null;

  const currentBuilding = allBuildings.find(b => b.id === selectedBuildingId);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Building2, label: 'Buildings', path: '/admin/buildings' },
    { icon: Users, label: 'Residents', path: '/admin/residents' },
    { icon: IndianRupee, label: 'Payments', path: '/admin/payments' },
    { icon: Receipt, label: 'Expenses', path: '/admin/expenses' },
    { icon: Bell, label: 'Reminders', path: '/admin/reminders' },
    { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
    { icon: IndianRupee, label: 'UPI Config', path: '/admin/upi-settings' },
    { icon: Tags, label: 'Flat Types', path: '/admin/room-types' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const handleExitImpersonation = () => {
    setImpersonating(false);
    setSelectedBuildingId(null);
    navigate('/super-admin');
  };

  return (
    <div className={cn("flex h-screen overflow-hidden flex-col", user.role === 'SUPER_ADMIN' && isImpersonating && "ring-2 ring-inset ring-amber-400/60")}>
      {/* Ghost Mode / Impersonation Banner */}
      {user.role === 'SUPER_ADMIN' && isImpersonating && (
        <div className="bg-linear-to-r from-amber-500 via-amber-400 to-orange-400 text-slate-900 px-3 py-2 flex items-center justify-between z-50 shadow-lg shadow-amber-500/30 shrink-0">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 text-amber-400 rounded-full text-[9px] font-black uppercase tracking-tighter shrink-0 animate-pulse">
              <Eye className="w-3 h-3" /> <span className="hidden xs:inline">Ghost</span>
            </div>
            {!(location.pathname.includes('/admin/buildings/') && location.pathname.includes('/layout')) && (
              <>
                <div className="h-4 w-px bg-white/20 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-[10px] font-bold hidden lg:inline whitespace-nowrap">Managing:</span>
                  <Select value={selectedBuildingId || 'none'} onValueChange={setSelectedBuildingId}>
                    <SelectTrigger className="h-7 bg-slate-900/20 border-none text-slate-900 w-32 sm:w-44 text-[10px] sm:text-xs font-bold ring-0 focus:ring-0">
                      <SelectValue placeholder="Select Building" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 text-white border-slate-700">
                      {allBuildings.map(b => (
                        <SelectItem key={b.id} value={b.id} className="hover:bg-slate-700 focus:bg-slate-700 text-xs">
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitImpersonation}
            className="text-slate-900 hover:bg-slate-900/10 h-7 text-[10px] font-black uppercase tracking-tight shrink-0 px-2 ml-1"
          >
            <CornerUpLeft className="w-3 h-3 mr-1 text-slate-700" />
            <span className="hidden sm:inline">Exit to Super Admin</span>
            <span className="inline sm:hidden">Exit</span>
          </Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "glass-dark flex flex-col z-50 transition-all duration-300 ease-in-out fixed md:relative h-full overflow-hidden",
            isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            isCollapsed ? "md:w-20" : "w-64"
          )}
        >
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0 shadow-sm transition-colors bg-linear-to-r from-indigo-900 to-[#0F172A] mb-4">
            <div className={cn("flex items-center gap-3 overflow-hidden", isCollapsed ? "md:justify-center md:gap-0" : "")}>
              <img alt="Lucky Luxury Logo" className="h-10 w-auto object-contain shrink-0 rounded-md bg-white" src="/logo.png" />
              {!isCollapsed && <span className="font-extrabold tracking-tight whitespace-nowrap text-white md:block hidden mt-0.5">Lucky Luxury PG Services</span>}
              <span className="font-extrabold tracking-tight whitespace-nowrap text-white block md:hidden ml-3 mt-0.5">Lucky Luxury PG</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden text-white/70 hover:bg-white/10" onClick={() => setIsMobileOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 px-3 mt-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 py-2.5 rounded-xl text-[13px] font-bold transition-all group",
                    isCollapsed ? "justify-center px-0" : "px-4",
                    isActive
                      ? (user.role === 'SUPER_ADMIN' ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30")
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className={cn("w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110", isActive ? (user.role === 'SUPER_ADMIN' ? "text-amber-400" : "text-indigo-400") : "text-slate-500")} />
                  {!isCollapsed && <span className="truncate md:block hidden">{item.label}</span>}
                  <span className="truncate block md:hidden">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 shrink-0 relative">
            <Button
              variant="outline"
              size="icon"
              className="absolute -right-4 -top-5 hidden md:flex h-8 w-8 rounded-full border-slate-200 bg-white shadow-sm text-slate-500 hover:text-slate-700 z-50"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>

            <div className={cn("mb-4 flex items-center gap-3", isCollapsed ? "md:justify-center" : "px-3")}>
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-bold uppercase shrink-0 border border-indigo-500/40 shadow">
                {user.name?.charAt(0) || 'A'}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden md:block hidden">
                  <div className="text-sm font-bold truncate text-white">{user.name}</div>
                  <div className="text-[10px] text-indigo-300 truncate uppercase font-black tracking-widest">{user.role.replace('_', ' ')}</div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className={cn(
                "text-red-400 hover:text-red-300 hover:bg-red-400/10 border-red-400/20 font-bold text-xs h-10",
                isCollapsed ? "md:w-full md:px-0 md:justify-center" : "w-full justify-start",
                "hidden md:flex"
              )}
              onClick={signOut}
            >
              <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>

            <Button
              variant="outline"
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 border-red-400/20 w-full justify-start flex md:hidden h-10 font-bold text-xs"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Sign Out</span>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Mobile Header (Admin context) */}
          <header className={cn("md:hidden h-16 border-b border-white/10 flex items-center justify-between px-4 z-10 shrink-0 shadow-sm bg-slate-900/90 backdrop-blur-md")}>
            <div className="flex items-center gap-3 text-white">
              <Button variant="ghost" size="icon" className="text-white/70 hover:bg-white/10 -ml-2" onClick={() => setIsMobileOpen(true)}>
                <Menu className="w-6 h-6" />
              </Button>
              <div className="flex items-center gap-2">
                <img alt="Lucky Luxury Logo" className="h-10 w-auto object-contain shrink-0 rounded-md bg-white" src="/logo.png" />
                <span className="font-extrabold tracking-tight text-white mt-0.5">Lucky Luxury PG</span>
              </div>
            </div>
            {isImpersonating && (
              <Badge className="bg-amber-500 text-slate-900 border-none font-black text-[9px] px-2 py-0.5">GHOST MODE</Badge>
            )}
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
