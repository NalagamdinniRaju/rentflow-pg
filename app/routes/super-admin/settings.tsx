import { Settings, Shield, Server, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export default function SuperAdminSettings() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-800" />
            Platform Variables
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Configure global application parameters</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
           <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Box className="w-5 h-5 text-blue-600"/> 
            General Platform Settings
          </CardTitle>
           <CardDescription>Core details visible across the network</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
           <div className="space-y-2">
             <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Application Title</Label>
             <Input defaultValue="LLPG PG Management" className="h-11 bg-slate-50 border-slate-200" />
           </div>
           <div className="space-y-2">
             <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Support Email</Label>
             <Input defaultValue="support@llpg.com" className="h-11 bg-slate-50 border-slate-200" />
           </div>
           <Button className="mt-2 bg-blue-600 hover:bg-blue-700 font-bold px-8">Save General Settings</Button>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
           <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600"/> 
            Security & Compliance
          </CardTitle>
           <CardDescription>Manage onboarding approval flow requirements</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
           <div className="flex items-center justify-between p-4 border border-slate-200 bg-slate-50/50 rounded-xl">
             <div>
               <p className="font-bold text-slate-900 text-sm">Auto-Approve Residents</p>
               <p className="text-xs text-slate-500 mt-0.5">Bypass PG Admin review when resident registers.</p>
             </div>
             <Button variant="outline" size="sm" className="bg-white font-bold h-8 text-[10px] uppercase">Off</Button>
           </div>
           <div className="flex items-center justify-between p-4 border border-slate-200 bg-slate-50/50 rounded-xl">
             <div>
               <p className="font-bold text-slate-900 text-sm">Mandatory KYC</p>
               <p className="text-xs text-slate-500 mt-0.5">Require Aadhaar/ID proof prior to admission.</p>
             </div>
             <Button variant="outline" size="sm" className="bg-white font-bold h-8 text-[10px] uppercase">On</Button>
           </div>
        </CardContent>
      </Card>

      <Card className="border-red-100 bg-red-50/30">
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-red-600 text-lg font-black uppercase tracking-tight">
            <Server className="w-5 h-5"/> 
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
           <p className="text-slate-600 text-sm font-medium">Destructive operations that affect the underlying database and potentially wipe out production records.</p>
           <div className="mt-6 flex flex-wrap gap-4">
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 font-bold">Reset Database (Dev Only)</Button>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 font-bold">Purge Inactive Records</Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
