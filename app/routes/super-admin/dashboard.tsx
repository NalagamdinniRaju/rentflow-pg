import { Building2, Users, MapPin, Activity } from 'lucide-react';
import { useSuperAdminDashboard } from '~/queries/dashboard.query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';

// Sample data for charts
const userGrowthData = [
  { month: 'Jan', residents: 120, admins: 5 },
  { month: 'Feb', residents: 150, admins: 5 },
  { month: 'Mar', residents: 180, admins: 6 },
  { month: 'Apr', residents: 250, admins: 8 },
  { month: 'May', residents: 310, admins: 9 },
  { month: 'Jun', residents: 380, admins: 12 },
];

const occupancyData = [
  { name: 'Elite PG', occupied: 85, vacant: 15 },
  { name: 'Sunrise Enclave', occupied: 45, vacant: 5 },
  { name: 'Grand Stay', occupied: 120, vacant: 30 },
  { name: 'Metro Boys', occupied: 65, vacant: 10 },
];

export default function SuperAdminDashboard() {
  const { data: stats, isLoading: loading } = useSuperAdminDashboard();

  const statCards = [
    { label: 'Total Buildings', value: stats?.buildings || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'PG Admins', value: stats?.admins || 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Residents', value: stats?.residents || 0, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Cities Covered', value: stats?.locations || 0, icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      <div className="text-center">
         <p className="text-slate-600 font-bold tracking-tight">Accessing Platform Core...</p>
         <p className="text-slate-400 text-[10px] uppercase tracking-widest animate-pulse mt-1 font-black">Authorized Personnel Only</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Global platform metrics and statistics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl border border-white/50 ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{s.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{s.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Platform Growth</CardTitle>
            <CardDescription>Resident and admin onboarding over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorResidents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAdmins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="residents" name="Total Residents" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorResidents)" />
                  <Area type="monotone" dataKey="admins" name="System Admins" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAdmins)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Occupancy Overview</CardTitle>
            <CardDescription>Live stats of filled vs vacant seats for top properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="occupied" name="Occupied Seats" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="vacant" name="Vacant Seats" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
