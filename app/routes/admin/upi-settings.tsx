import { IndianRupee, Upload, Info, CheckCircle2, Building, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useManagementContext } from '~/hooks/use-management-context';
import { useBuildingById, useUpdateBuilding } from '~/queries/buildings.query';
import { supabase } from '~/lib/supabase';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from '~/components/ui/dialog';
import { Eye } from 'lucide-react';

export default function AdminUpiSettings() {
  const { currentBuildingId, isImpersonating } = useManagementContext();
  const { data: building, isLoading: loadingBuilding } = useBuildingById({ 
    variables: { buildingId: currentBuildingId || '' },
    enabled: !!currentBuildingId
  });
  const { mutateAsync: updateBuilding } = useUpdateBuilding();

  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (building) {
      setUpiId(building.upi_id || '');
      setUpiName(building.upi_name || '');
      setQrCodeUrl(building.qr_code_url || '');
    }
  }, [building]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentBuildingId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    try {
      setUploading(true);
      const fileName = `building-${currentBuildingId}-qr-${Date.now()}`;
      const { data, error } = await supabase.storage
        .from('payment-configs')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-configs')
        .getPublicUrl(data.path);

      setQrCodeUrl(publicUrl);
      toast.success("Building QR Code uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentBuildingId) return;
    try {
      setSaving(true);
      await updateBuilding({
        buildingId: currentBuildingId,
        name: building?.name || '',
        admin_id: building?.admin_id || null,
        status: building?.status || 'ACTIVE',
        upi_id: upiId,
        upi_name: upiName,
        qr_code_url: qrCodeUrl,
      });
      toast.success("Building payment details updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!currentBuildingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm text-center">No Building Selected for Management</p>
      </div>
    );
  }

  if (loadingBuilding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/70 text-sm font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center glass-card p-6 rounded-2xl relative overflow-hidden">
        {isImpersonating && (
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
        )}
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <IndianRupee className="w-6 h-6 text-emerald-600" />
            </div>
            Payment Setup
          </h1>
          <p className="text-slate-500 mt-1 font-medium flex items-center gap-1.5">
            <Building className="w-4 h-4" />
            Configuring payments for <span className="text-slate-900 font-black">{building?.name}</span>
          </p>
        </div>
        {isImpersonating && (
          <div className="px-3 py-1 bg-amber-500 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-tighter">
            Ghost Mode Active
          </div>
        )}
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-4 text-emerald-800">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">Custom Payment Source</p>
          <p className="text-xs mt-1 leading-relaxed">
            By setting these details, you override the platform-wide defaults. All residents in this building will receive these credentials in their WhatsApp reminders. 
            <strong> Leave blank to use the system fallback.</strong>
          </p>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
           <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">Building Credentials</CardTitle>
           <CardDescription>Localized collection details for residents</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
           <div className="grid sm:grid-cols-2 gap-8">
             <div className="space-y-3">
               <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Receiver UPI ID</Label>
               <Input 
                 placeholder="e.g. manager@oksbi" 
                 value={upiId} 
                 onChange={e => setUpiId(e.target.value)} 
                 className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-inner focus:ring-emerald-500"
               />
               <p className="text-[10px] text-slate-400 font-medium italic">Residents will pay directly to this ID.</p>
             </div>
             <div className="space-y-3">
               <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Receiver Name</Label>
               <Input 
                 placeholder="e.g. John Doe (Manager)" 
                 value={upiName} 
                 onChange={e => setUpiName(e.target.value)} 
                 className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-inner focus:ring-emerald-500"
               />
               <p className="text-[10px] text-slate-400 font-medium italic">Matches the KYC name on your bank account.</p>
             </div>
           </div>

           <div className="space-y-4">
             <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Building-Specific QR Code</Label>
              <div className="flex flex-col sm:flex-row items-center gap-10 p-8 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                {qrCodeUrl ? (
                  <div className="space-y-4 shrink-0">
                    <div className="w-40 h-40 rounded-2xl border border-white object-contain bg-white p-3 shadow-2xl transition-all">
                      <img 
                        src={qrCodeUrl} 
                        alt="Building QR Code" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                       <Dialog>
                         <DialogTrigger asChild>
                           <Button variant="outline" size="sm" className="w-full h-9 text-xs font-black uppercase tracking-tighter bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-200">
                             <Eye className="w-4 h-4 mr-2 text-emerald-600" /> View Preview
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                           <DialogHeader className="p-6 bg-slate-900 text-white">
                             <DialogTitle className="text-white flex items-center gap-2">
                               <Building className="w-5 h-5 text-emerald-400" /> Building QR Code
                             </DialogTitle>
                           </DialogHeader>
                           <div className="flex items-center justify-center p-10 bg-white">
                             <img src={qrCodeUrl} alt="Building QR" className="max-w-full max-h-[60vh] object-contain shadow-sm rounded-lg" />
                           </div>
                           <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                              <DialogClose asChild>
                                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Close Window</Button>
                              </DialogClose>
                           </div>
                         </DialogContent>
                       </Dialog>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="w-full h-9 text-[10px] uppercase tracking-widest font-black text-red-500 hover:text-red-600 hover:bg-red-50"
                         onClick={() => setQrCodeUrl('')}
                       >
                         Delete Image
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 bg-white shrink-0">
                    <Upload className="w-10 h-10 mb-2 opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-widest">No QR Image</span>
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div className="relative">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      id="building-qr-upload"
                      className="hidden" 
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    <Button 
                      variant="outline" 
                      className="bg-white hover:bg-slate-50 border-slate-200 font-black text-xs h-10 px-6 shadow-sm"
                      disabled={uploading}
                      onClick={() => document.getElementById('building-qr-upload')?.click()}
                    >
                      {uploading ? 'Uploading...' : 'Upload Building QR'}
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black italic">Accepted: JPG, PNG, WEBP (Max 2MB)</p>
                </div>
             </div>
           </div>

           <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-emerald-600">
                 <CheckCircle2 className="w-5 h-5 shadow-emerald-500/20" />
                 <span className="text-xs font-black uppercase tracking-widest tracking-tighter">Verified Building Vault</span>
              </div>
              <Button 
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 font-black px-12 transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-wider text-xs"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Secure Building Setup'}
              </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
