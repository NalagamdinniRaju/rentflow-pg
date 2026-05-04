import { Settings2, UserCog, Building2, Bell, Tags } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useAuthStore } from '~/store/auth.store';

export default function AdminSettings() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center glass-card p-6 rounded-2xl">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-slate-600" />
            Admin Settings
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your account and preferences</p>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
           <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <UserCog className="w-5 h-5 text-blue-500"/> 
            Personal Profile
          </CardTitle>
           <CardDescription>Update your contact info and personal details.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
           <div className="grid sm:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
               <Input value={user?.name || ''} readOnly className="h-11 bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed" />
             </div>
             <div className="space-y-2">
               <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
               <Input value={user?.email || ''} readOnly className="h-11 bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed" />
             </div>
             <div className="space-y-2">
               <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Role Level</Label>
               <Input value={user?.role || ''} readOnly className="h-11 bg-slate-50 border-slate-100 font-bold" />
             </div>
           </div>
           <Button className="mt-4 font-bold border-slate-200" variant="outline" disabled>Update Profile</Button> 
           <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Currently, profile updates must be processed through Super Admin.</p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
           <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500"/> 
            Preferences
          </CardTitle>
           <CardDescription>Customize your notification settings.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
           <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 shadow-sm transition-all border-dashed">
             <div>
               <p className="font-bold text-slate-900 text-sm">Email Notifications</p>
               <p className="text-xs text-slate-500 mt-0.5">Receive alerts when new residents register</p>
             </div>
             <Button variant="outline" size="sm" className="font-bold h-8 text-[10px] uppercase">Enabled</Button>
           </div>
           
           <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 shadow-sm transition-all border-dashed">
             <div>
               <p className="font-bold text-slate-900 text-sm">SMS Alerts</p>
               <p className="text-xs text-slate-500 mt-0.5">Get text messages for delayed payments</p>
             </div>
             <Button variant="outline" size="sm" className="font-bold h-8 text-[10px] uppercase">Disabled</Button>
           </div>
        </CardContent>
      </Card>
      
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
           <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500"/> 
            System Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
           <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                 <Tags className="w-5 h-5 text-indigo-600" />
               </div>
               <div>
                 <p className="font-bold text-slate-900 text-sm">Flat Configurations</p>
                 <p className="text-xs text-slate-500 mt-0.5">Manage AC/Non-AC types and sharing categories</p>
               </div>
             </div>
             <Button variant="outline" className="font-bold border-indigo-100 text-indigo-700 hover:bg-indigo-50" onClick={() => navigate('/admin/room-types')}>
               Manage Types
             </Button>
           </div>
           <p className="text-[10px] text-slate-400 py-2 font-medium italic">To modify building allocation boundaries or create new facilities, please contact the Super Admin team.</p>
        </CardContent>
      </Card>
    </div>
  );
}
