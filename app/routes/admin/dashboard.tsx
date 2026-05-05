import { Link } from 'react-router';
import { Users, IndianRupee, UserCheck, AlertCircle, TrendingUp, TrendingDown, DollarSign, Wallet, Users2 } from 'lucide-react';
import { useAuthStore } from '~/store/auth.store';
import { formatCurrency } from '~/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';

import { useAdminDashboard } from '~/queries/dashboard.query';

import { useManagementContext } from '~/hooks/use-management-context';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { buildingIds } = useManagementContext();
  
  const { data, isLoading: loading } = useAdminDashboard({
    variables: { buildingIds },
    enabled: buildingIds.length > 0,
  });

  const stats = data?.stats || {
    activeResidents: 0,
    pendingApprovals: 0,
    vacatedThisMonth: 0,
    collectionsThisMonth: 0,
    outstandings: 0,
  };

  const occupancyData = data?.occupancyData || [];
  const revenueTrend = data?.revenueTrend || [];
  const occupancyTrend = data?.occupancyTrend || [];

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

  const statCards = [
    { label: 'Active Tenants', value: stats.activeResidents, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12%', up: true },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Users2, color: 'text-amber-600', bg: 'bg-amber-50', trend: '4 New', up: true },
    { label: 'Collection (MTD)', value: formatCurrency(stats.collectionsThisMonth), icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+8.2%', up: true },
    { label: 'Outstanding Bills', value: formatCurrency(stats.outstandings), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', trend: '-2.4%', up: false },
  ];

  if (loading && !!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
           <p className="text-slate-600 font-bold">Synchronizing Executive Data...</p>
           <p className="text-slate-400 text-[10px] uppercase tracking-widest animate-pulse mt-1 font-bold">Secure connection established</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Welcome back! Here's your property performance overview.</p>
        </div>
        <div className="flex gap-2">
           <Link to="/admin/reports">
             <Button variant="outline" className="shadow-sm">Detailed Reports</Button>
           </Link>
           <Link to="/admin/residents/add">
             <Button className="shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">Add Resident</Button>
           </Link>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s) => (
          <Card key={s.label} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <Badge variant={s.up ? 'success' : 'danger'} className="rounded-full px-2 py-0 text-[10px]">
                   {s.up ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                   {s.trend}
                </Badge>
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{s.value}</h3>
            </CardContent>
            <div className={`h-1.5 w-full ${s.bg.replace('bg-', 'bg-')}`} />
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <DollarSign className="w-5 h-5 text-blue-500" /> Revenue vs Expenses
            </CardTitle>
            <CardDescription>Comparison of monthly collections and building costs</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Revenue" />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Total Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Users className="w-5 h-5 text-emerald-500" /> Tenant Status
            </CardTitle>
            <CardDescription>Current resident distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 w-full mt-4">
               {occupancyData.map((d, i) => (
                 <div key={d.name} className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 ha-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-800">{d.value}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-emerald-500" /> Occupancy Trend
            </CardTitle>
            <CardDescription>Tracking active residents over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyTrend}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip />
                  <Area type="monotone" dataKey="active" stroke="#10b981" fillOpacity={1} fill="url(#colorActive)" strokeWidth={3} />
                </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
          <CardHeader>
            <CardTitle className="text-white">Quick Insights</CardTitle>
            <CardDescription className="text-blue-100">Monthly AI Analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-xs font-bold text-blue-200 uppercase mb-1">Best Performing PG</p>
                <div className="flex justify-between items-center">
                   <h4 className="font-bold text-lg">Royal Heritage PG</h4>
                   <Badge className="bg-emerald-500 text-white border-none">98% Full</Badge>
                </div>
             </div>
             <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-xs font-bold text-blue-200 uppercase mb-1">Financial Health</p>
                <div className="flex justify-between items-center">
                   <h4 className="font-bold text-lg">Good</h4>
                   <span className="text-emerald-300 font-bold">+15% vs LY</span>
                </div>
                <p className="text-[10px] text-blue-200 mt-2 italic">Outstanding payments have decreased by 2.4% since last week.</p>
             </div>
             <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold mt-2">View Full Analysis</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

