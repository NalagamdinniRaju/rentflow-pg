import { Settings, Shield, Server, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export default function SuperAdminSettings() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-800" />
            Platform Variables
          </h1>
          <p className="text-slate-500 mt-1">Configure global application parameters</p>
        </div>
      </div>

      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2"><Box className="w-5 h-5 text-blue-600"/> General Platform Settings</CardTitle>
           <CardDescription>Core details visible across the network</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
             <Label>Application Title</Label>
             <Input defaultValue="LLPG PG Management" />
           </div>
           <div className="space-y-2">
             <Label>Support Email</Label>
             <Input defaultValue="support@llpg.com" />
           </div>
           <Button className="mt-2 bg-blue-600 hover:bg-blue-700">Save General Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-600"/> Security & Compliance</CardTitle>
           <CardDescription>Manage onboarding approval flow requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between p-4 border border-slate-200 bg-slate-50 rounded-lg">
             <div>
               <p className="font-semibold text-slate-900">Auto-Approve Residents</p>
               <p className="text-sm text-slate-500">Bypass PG Admin review when resident registers.</p>
             </div>
             <Button variant="outline" size="sm" className="bg-white">Off</Button>
           </div>
           <div className="flex items-center justify-between p-4 border border-slate-200 bg-slate-50 rounded-lg">
             <div>
               <p className="font-semibold text-slate-900">Mandatory KYC</p>
               <p className="text-sm text-slate-500">Require Aadhaar/ID proof prior to admission.</p>
             </div>
             <Button variant="outline" size="sm" className="bg-white">On</Button>
           </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-red-600"><Server className="w-5 h-5"/> Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
           <p className="text-slate-600 py-2 text-sm">Destructive operations that affect the underlying Supabase database and potentially wipe out production records.</p>
           <div className="mt-4 flex gap-4">
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">Reset Database (Dev Only)</Button>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">Purge Inactive Records</Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
