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
    ...(user.role === 'SUPER_ADMIN' && isImpersonating ? [] : [{ icon: Building2, label: 'Buildings', path: '/admin/buildings' }]),
    { icon: Users, label: 'Residents', path: '/admin/residents' },
    { icon: IndianRupee, label: 'Payments', path: '/admin/payments' },
    { icon: Receipt, label: 'Expenses', path: '/admin/expenses' },
    { icon: Bell, label: 'Reminders', path: '/admin/reminders' },
    { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
    { icon: Tags, label: 'Room Types', path: '/admin/room-types' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const handleExitImpersonation = () => {
    setImpersonating(false);
    setSelectedBuildingId(null);
    navigate('/super-admin');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden flex-col">
      {/* Ghost Mode / Impersonation Banner */}
      {user.role === 'SUPER_ADMIN' && isImpersonating && (
        <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between z-50 shadow-2xl shrink-0">
           <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500 text-slate-900 rounded-full text-[9px] font-black uppercase tracking-tighter shrink-0">
                <Eye className="w-3 h-3" /> <span className="hidden xs:inline">Ghost</span>
              </div>
              <div className="h-4 w-[1px] bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-[10px] font-bold hidden lg:inline whitespace-nowrap">Managing:</span>
                <Select value={selectedBuildingId || 'none'} onValueChange={setSelectedBuildingId}>
                   <SelectTrigger className="h-7 bg-white/10 border-none text-white w-[130px] sm:w-[180px] text-[10px] sm:text-xs font-bold ring-0 focus:ring-0">
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
           </div>
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleExitImpersonation}
            className="text-white hover:bg-white/10 h-7 text-[10px] font-black uppercase tracking-tight shrink-0 px-2 ml-1"
           >
              <CornerUpLeft className="w-3 h-3 mr-1 text-amber-400" /> 
              <span className="hidden sm:inline">Exit to Super Admin</span>
              <span className="inline sm:hidden">Exit</span>
           </Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Backdrop */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={cn(
            "bg-white border-r border-slate-200 flex flex-col shadow-sm z-50 transition-all duration-300 ease-in-out fixed md:relative h-full",
            isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            isCollapsed ? "md:w-20" : "w-64"
          )}
        >
          <div className={cn("h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0 shadow-sm transition-colors", user.role === 'SUPER_ADMIN' ? 'bg-slate-800' : 'bg-emerald-600')}>
            <div className={cn("flex items-center gap-3 text-white overflow-hidden", isCollapsed ? "md:justify-center md:gap-0" : "")}>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                {user.role === 'SUPER_ADMIN' ? <Settings className="w-4 h-4 text-white" /> : <Building2 className="w-4 h-4 text-white" />}
              </div>
              {!isCollapsed && <span className="font-bold tracking-tight whitespace-nowrap md:block hidden">{user.role === 'SUPER_ADMIN' ? 'System Proxy' : 'PG Manager'}</span>}
              <span className="font-bold tracking-tight whitespace-nowrap block md:hidden ml-3">{user.role === 'SUPER_ADMIN' ? 'System Proxy' : 'PG Manager'}</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10" onClick={() => setIsMobileOpen(false)}>
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
                      ? (user.role === 'SUPER_ADMIN' ? "bg-slate-900 shadow-lg shadow-slate-900/20 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100") 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110", isActive ? (user.role === 'SUPER_ADMIN' ? "text-amber-400" : "text-emerald-600") : "text-slate-400")} />
                  {!isCollapsed && <span className="truncate md:block hidden">{item.label}</span>}
                  <span className="truncate block md:hidden">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 shrink-0 relative">
            <Button 
              variant="outline" 
              size="icon"
              className="absolute -right-4 top-[-20px] hidden md:flex h-8 w-8 rounded-full border-slate-200 bg-white shadow-sm text-slate-500 hover:text-slate-700 z-50"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>

            <div className={cn("mb-4 flex items-center gap-3", isCollapsed ? "md:justify-center" : "px-3")}>
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase shrink-0 border border-slate-200">
                {user.name?.charAt(0) || 'A'}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden md:block hidden">
                  <div className="text-sm font-bold truncate text-slate-900">{user.name}</div>
                  <div className="text-[10px] text-slate-400 truncate uppercase font-black tracking-widest">{user.role.replace('_', ' ')}</div>
                </div>
              )}
            </div>
            
            <Button 
              variant="outline" 
              className={cn(
                "text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-xs h-10",
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
              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full justify-start flex md:hidden h-10 font-bold text-xs"
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
          <header className={cn("md:hidden h-16 border-b flex items-center justify-between px-4 z-10 shrink-0 shadow-sm", user.role === 'SUPER_ADMIN' ? 'bg-slate-900 border-slate-800' : 'bg-emerald-600 border-emerald-700')}>
            <div className="flex items-center gap-3 text-white">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2" onClick={() => setIsMobileOpen(true)}>
                <Menu className="w-6 h-6" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold tracking-tight">{user.role === 'SUPER_ADMIN' ? 'System Proxy' : 'PG Manager'}</span>
              </div>
            </div>
            {isImpersonating && (
               <Badge className="bg-amber-500 text-slate-900 border-none font-black text-[9px] px-2 py-0.5">GHOST MODE</Badge>
            )}
          </header>

          <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
