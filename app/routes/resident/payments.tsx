// @ts-nocheck
import { useNavigate } from 'react-router';
import { 
  ChevronLeft, Calendar, 
  ArrowUpRight, Clock, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { 
  useMyPayments, 
  useSubmitPayment 
} from '~/queries/payments.query';
import { formatCurrency, formatDate, cn } from '~/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '~/store/auth.store';
import { supabase } from '~/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function ResidentPaymentsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: payments = [], isLoading: loading } = useMyPayments({ 
    variables: { userId: user?.id || '' },
    enabled: !!user?.id 
  });
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [txnRef, setTxnRef] = useState('');
  const [uploading, setUploading] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const { mutateAsync: submitMutation } = useSubmitPayment();

  // Fetch settings for UPI
  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('system_settings').select('*').single();
      return data;
    }
  });

  const generateUpiLink = (amount: number, monthYear?: string) => {
    const pa = settings?.upi_id || 'payment@upi';
    const pn = encodeURIComponent(settings?.upi_name || 'RentFlow PG');
    const tn = encodeURIComponent(`Rent ${monthYear || ''} - ${user?.name || ''}`);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${amount}&cu=INR&tn=${tn}`;
  };

  const handleUpload = async (file: File) => {
    const ext = file.name.split('.').pop();
    const path = `screenshots/${user?.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('payments').upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('payments').getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmitTxn = async () => {
    if (!txnRef) return toast.error("Transaction ID is required");
    setUploading(true);
    try {
      let url = '';
      if (screenshot) {
        url = await handleUpload(screenshot);
      }
      await submitMutation({
        paymentId: selectedPayment.id,
        transactionRef: txnRef,
        screenshotUrl: url
      });
      toast.success("Payment details submitted for verification!");
      setSelectedPayment(null);
      setTxnRef('');
      setScreenshot(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9] pb-10">
      {/* Header */}
      <div className="bg-[#0F172A] px-5 pt-4 pb-6 flex items-center gap-4 shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-white text-xl font-semibold">Payment History</h1>
          <span className="text-white/40 text-[10px] uppercase tracking-widest">{payments.length} Records Found</span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-4 -mt-4">
        <div className="glass-card rounded-[24px] p-5 shadow-sm grid grid-cols-2 gap-4">
           <div className="flex flex-col">
              <span className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Total Paid</span>
              <span className="text-emerald-600 text-lg font-bold">
                {formatCurrency(payments.filter(p => p.status === 'PAID').reduce((acc, c) => acc + Number(c.amount), 0))}
              </span>
           </div>
           <div className="flex flex-col border-l border-slate-100 pl-4">
              <span className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Outstanding</span>
              <span className="text-red-500 text-lg font-bold">
                {formatCurrency(payments.filter(p => p.status !== 'PAID').reduce((acc, c) => acc + Number(c.amount), 0))}
              </span>
           </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-6 space-y-3">
        {payments.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
             <Clock className="w-12 h-12 mx-auto mb-4 opacity-10" />
             <p>No payments recorded yet.</p>
          </div>
        ) : (
          payments.map((p) => {
            const isPaid = p.status === 'PAID';
            const isSubmitted = p.status === 'SUBMITTED';
            const isRejected = p.status === 'REJECTED';
            
            return (
              <div key={p.id} className="glass-card rounded-[22px] p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isPaid ? 'bg-emerald-50 text-emerald-600' : isSubmitted ? 'bg-blue-50 text-blue-600' : isRejected ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                    {isPaid ? <CheckCircle2 className="w-6 h-6" /> : isSubmitted ? <Clock className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className="font-bold text-slate-900 truncate">
                        {p.month_year ? `${new Date(p.month_year + '-01').toLocaleDateString('en', { month: 'long', year: 'numeric' })} Rent` : `${new Date(p.year, p.month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })} Rent`}
                      </h3>
                      <span className={`text-sm font-black ${isPaid ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {formatCurrency(p.amount)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {isPaid ? formatDate(p.paid_at || p.paid_date) : isSubmitted ? 'Verifying...' : 'Pending'}
                      </span>
                      {isPaid && p.payment_mode && (
                        <>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="flex items-center gap-1 uppercase tracking-wider">{p.payment_mode}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                      isPaid ? "bg-emerald-100 text-emerald-700" :
                      isSubmitted ? "bg-blue-100 text-blue-700" :
                      isRejected ? "bg-red-100 text-red-700" :
                      "bg-orange-100 text-orange-700"
                    )}>
                      {p.status}
                    </span>
                  </div>
                </div>

                {!isPaid && !isSubmitted && (
                  <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-50">
                    <Button 
                      asChild 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl h-10 font-bold"
                    >
                      <a href={generateUpiLink(Number(p.amount), p.month_year)}>Pay Now</a>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedPayment(p)}
                      className="flex-1 rounded-xl h-10 font-bold border-slate-200"
                    >
                      I Have Paid
                    </Button>
                  </div>
                )}

                {isRejected && p.remarks && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100 mt-2">
                    <p className="text-[11px] text-red-700 font-semibold underline mb-1 uppercase tracking-wider">Reason for rejection:</p>
                    <p className="text-sm text-red-800 italic">"{p.remarks}"</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!selectedPayment} onOpenChange={(o) => !o && setSelectedPayment(null)}>
        <DialogContent className="max-w-sm rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Submit Payment Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold">UPI Transaction ID *</Label>
              <Input 
                placeholder="e.g. 401234567890" 
                value={txnRef}
                onChange={e => setTxnRef(e.target.value)}
                className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium"
              />
              <p className="text-[10px] text-slate-400 italic">Found in your payment app (Google Pay, PhonePe, etc.)</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 font-bold">Screenshot (Optional)</Label>
              <div className="relative">
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setScreenshot(e.target.files?.[0] || null)}
                  className="h-12 pt-3 bg-slate-50 border-slate-200 rounded-xl cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
             <Button 
               className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-md font-bold"
               onClick={handleSubmitTxn}
               disabled={uploading}
             >
               {uploading ? "Submitting..." : "Confirm & Submit"}
             </Button>
             <Button variant="ghost" onClick={() => setSelectedPayment(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
