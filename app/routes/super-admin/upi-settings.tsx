import { IndianRupee, Upload, Info, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useSystemSettings, useUpdateSystemSettings } from '~/queries/system.query';
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

export default function SuperAdminUpiSettings() {
  const { data: settings, isLoading: loadingSettings } = useSystemSettings();
  const { mutateAsync: updateSettings } = useUpdateSystemSettings();

  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setUpiId(settings.upi_id || '');
      setUpiName(settings.upi_name || '');
      setQrCodeUrl(settings.qr_code_url || '');
    }
  }, [settings]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    try {
      setUploading(true);
      const fileName = `global-qr-${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('payment-configs')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-configs')
        .getPublicUrl(data.path);

      setQrCodeUrl(publicUrl);
      toast.success("Global QR Code uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await updateSettings({
        upi_id: upiId,
        upi_name: upiName,
        qr_code_url: qrCodeUrl,
      });
      toast.success("Platform payment defaults updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white/70 text-sm font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center glass-card p-6 rounded-2xl">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-amber-500" />
            Global UPI Settings
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage platform-wide payment fallbacks for all buildings</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">Important Notes</p>
          <p className="text-xs mt-1">
            These details are used as the <strong>Source of Truth</strong> if a specific PG building has not configured its own UPI ID or QR Code.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
           <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">Configuration</CardTitle>
           <CardDescription>Primary payment channel details for the entire network</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
           <div className="grid sm:grid-cols-2 gap-8">
             <div className="space-y-3">
               <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Receiver UPI ID</Label>
               <Input 
                 placeholder="e.g. name@upi" 
                 value={upiId} 
                 onChange={e => setUpiId(e.target.value)} 
                 className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-inner"
               />
               <p className="text-[10px] text-slate-400 font-medium">This is where all payments will be routed by default.</p>
             </div>
             <div className="space-y-3">
               <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Display Name</Label>
               <Input 
                 placeholder="e.g. LLPG PG Services" 
                 value={upiName} 
                 onChange={e => setUpiName(e.target.value)} 
                 className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-inner"
               />
               <p className="text-[10px] text-slate-400 font-medium">The name displayed on the resident's payment app.</p>
             </div>
           </div>

           <div className="space-y-4">
             <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Primary QR Code (Fallback)</Label>
              <div className="flex flex-col sm:flex-row items-center gap-10 p-8 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-inner">
                {qrCodeUrl ? (
                  <div className="space-y-4 shrink-0">
                    <div className="w-40 h-40 rounded-2xl border border-slate-200 object-contain bg-white p-3 shadow-xl ring-4 ring-white transition-all">
                      <img 
                        src={qrCodeUrl} 
                        alt="Global QR Code" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                       <Dialog>
                         <DialogTrigger asChild>
                           <Button variant="outline" size="sm" className="w-full h-9 text-xs font-bold bg-white hover:bg-slate-50 border-slate-200">
                             <Eye className="w-3.5 h-3.5 mr-2 text-blue-600" /> View Full QR
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                           <DialogHeader className="p-6 bg-slate-900 text-white">
                             <DialogTitle className="text-white">Platform QR Code</DialogTitle>
                           </DialogHeader>
                           <div className="flex items-center justify-center p-8 bg-white">
                             <img src={qrCodeUrl} alt="Global QR" className="max-w-full max-h-[60vh] object-contain shadow-sm rounded-lg" />
                           </div>
                           <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                              <DialogClose asChild>
                                <Button variant="ghost" className="text-xs font-bold italic uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Close Preview</Button>
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
                         Remove Image
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 bg-white shrink-0 shadow-inner">
                    <Upload className="w-10 h-10 mb-2 opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div className="relative">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      id="qr-upload"
                      className="hidden" 
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    <Button 
                      variant="outline" 
                      className="bg-white hover:bg-slate-50 border-slate-200 font-bold"
                      disabled={uploading}
                      onClick={() => document.getElementById('qr-upload')?.click()}
                    >
                      {uploading ? 'Processing File...' : 'Choose File to Upload'}
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black italic">Accepted: JPG, PNG, WEBP (Max 2MB)</p>
                </div>
             </div>
           </div>

           <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-emerald-600">
                 <CheckCircle2 className="w-5 h-5" />
                 <span className="text-xs font-bold uppercase tracking-tight">Security Hardened Entry</span>
              </div>
              <Button 
                size="lg"
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10 font-bold px-10 transition-all hover:-translate-y-0.5"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? 'Synchronizing...' : 'Update Global Settings'}
              </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
