import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router';
import { Building2, Users, MapPin, Settings, LogOut, LayoutDashboard, Menu, X, ChevronLeft, ChevronRight, IndianRupee } from 'lucide-react';
import { useAuthStore } from '~/store/auth.store';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';

export default function SuperAdminLayout() {
  const { user, initialized, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (initialized) {
      if (!user) navigate('/login');
      else if (user.role !== 'SUPER_ADMIN') navigate('/login');
    }
  }, [user, initialized, navigate]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (!initialized || !user || user.role !== 'SUPER_ADMIN') return null;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/super-admin' },
    { icon: Building2, label: 'Buildings', path: '/super-admin/buildings' },
    { icon: IndianRupee, label: 'UPI Settings', path: '/super-admin/upi-settings' },
    { icon: Users, label: 'PG Admins', path: '/super-admin/admins' },
    { icon: MapPin, label: 'Locations', path: '/super-admin/locations' },
    { icon: Settings, label: 'System Settings', path: '/super-admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
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
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0 bg-white shadow-sm mb-4">
          <div className={cn("flex items-center gap-3 overflow-hidden", isCollapsed ? "md:justify-center md:gap-0" : "")}>
            <img alt="Lucky Luxury Logo" className="h-10 w-auto object-contain shrink-0 rounded-md bg-white" src="/logo.png" />
            {!isCollapsed && <span className="font-extrabold text-[#072b7e] tracking-tight whitespace-nowrap md:block hidden mt-0.5">Lucky Luxury PG Services</span>}
            <span className="font-extrabold text-[#072b7e] tracking-tight whitespace-nowrap block md:hidden ml-3 mt-0.5">Lucky Luxury PG</span>
          </div>
          {/* Mobile close button */}
          <Button variant="ghost" size="icon" className="md:hidden text-slate-500 hover:bg-slate-100" onClick={() => setIsMobileOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isCollapsed ? "justify-center px-0" : "px-3",
                  isActive 
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-600" : "text-slate-400")} />
                {!isCollapsed && <span className="truncate md:block hidden">{item.label}</span>}
                <span className="truncate block md:hidden">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 shrink-0 relative">
          {/* Desktop collapse toggle */}
          <Button 
            variant="outline" 
            size="icon"
            className="absolute -right-4 top-[-20px] hidden md:flex h-8 w-8 rounded-full border-slate-200 bg-white shadow-sm text-slate-500 hover:text-slate-700 z-50"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>

          <div className={cn("mb-4 flex items-center gap-3", isCollapsed ? "md:justify-center" : "px-3")}>
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase shrink-0">
              {user.name?.charAt(0) || 'S'}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden md:block hidden">
                <div className="text-sm font-semibold truncate text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
              </div>
            )}
            <div className="overflow-hidden block md:hidden">
              <div className="text-sm font-semibold truncate text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className={cn(
              "text-red-600 hover:text-red-700 hover:bg-red-50",
              isCollapsed ? "md:w-full md:px-0 md:justify-center" : "w-full justify-start",
              "hidden md:flex"
            )}
            onClick={signOut}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>

          <Button 
            variant="outline" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full justify-start flex md:hidden"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 -ml-2" onClick={() => setIsMobileOpen(true)}>
              <Menu className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <img alt="Lucky Luxury Logo" className="h-10 w-auto object-contain shrink-0 rounded-md bg-white" src="/logo.png" />
              <span className="font-extrabold text-[#072b7e] tracking-tight mt-0.5">Lucky Luxury PG</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
