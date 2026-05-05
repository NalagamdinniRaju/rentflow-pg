// @ts-nocheck
import { useState } from 'react';
import { IndianRupee, CheckCircle, AlertTriangle, CalendarDays } from 'lucide-react';
import { useAuthStore } from '~/store/auth.store';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { formatCurrency, getStatusColor, MONTH_NAMES, formatMonthYear } from '~/lib/utils';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';

import { useAdminBuildingIds } from '~/queries/buildings.query';
import { 
  useMonthlyPayments, 
  useMarkPaymentPaid, 
  useVerifyPayment, 
  useRejectPayment,
  useUpdatePaymentStatus 
} from '~/queries/payments.query';
import { cn } from '~/lib/utils';

const paymentSchema = z.object({
  payment_mode: z.enum(['UPI', 'Cash', 'Bank']),
  amount_paid: z.coerce.number().min(0, "Amount must be positive"),
  remarks: z.string().optional()
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

import { useManagementContext } from '~/hooks/use-management-context';

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const { buildingIds } = useManagementContext();
  
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [openVerify, setOpenVerify] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { payment_mode: 'UPI', remarks: '' }
  });

  const { data: payments = [], isLoading: loading } = useMonthlyPayments({
    variables: { 
      buildingIds, 
      month: parseInt(filterMonth), 
      year: parseInt(filterYear) 
    },
    enabled: buildingIds.length > 0
  });

  const filteredPayments = payments.filter(p => filterStatus === 'ALL' || p.status === filterStatus);

  const { mutateAsync: updatePaymentStatus } = useUpdatePaymentStatus();
  const { mutateAsync: verifyPayment } = useVerifyPayment();
  const { mutateAsync: rejectPayment } = useRejectPayment();
  const onSubmit = async (values: PaymentFormValues) => {
    if (!selectedPayment) return;

    // We use the new increment logic: the RPC adds the input to the existing total_paid.
    try {
      await updatePaymentStatus({
        paymentId: selectedPayment.id,
        resident_id: selectedPayment.resident_id,
        amount_due: selectedPayment.amount, // Total monthly target
        amount_paid: values.amount_paid, // The amount being paid RIGHT NOW
        payment_mode: values.payment_mode,
        remarks: values.remarks || null,
        month: formatMonthYear(parseInt(filterMonth), parseInt(filterYear)),
        status: 'PAID' // RPC will calculate if it should be PAID or PARTIAL
      });
      
      const remaining = selectedPayment.status === 'PARTIALLY_PAID' ? Number(selectedPayment.balance) : Number(selectedPayment.amount);
      const isFull = values.amount_paid >= remaining;
      toast.success(isFull ? "Full payment recorded" : `Partial payment of ${formatCurrency(values.amount_paid)} recorded`);
      setDialogOpen(false);
      form.reset();
    } catch (err: any) {
      toast.error(err.message || "Failed to log payment");
    }
  };

  const openPaymentDialog = (p: any) => {
    setSelectedPayment(p);
    form.reset({
      payment_mode: 'UPI',
      amount_paid: p.status === 'PARTIALLY_PAID' ? Number(p.balance) : Number(p.amount), // Defaults to remaining balance
      remarks: ''
    });
    if (p.status === 'SUBMITTED') {
      setOpenVerify(true);
    } else {
      setDialogOpen(true);
    }
  };

  const handleApprove = async () => {
    try {
      await verifyPayment({ 
        paymentId: selectedPayment.id,
        resident_id: selectedPayment.resident_id,
        month: parseInt(filterMonth),
        year: parseInt(filterYear)
      });
      toast.success("Payment verified and marked as PAID");
      setOpenVerify(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return toast.error("Please provide a reason for rejection");
    try {
      await rejectPayment({ 
        paymentId: selectedPayment.id, 
        remarks: rejectReason,
        resident_id: selectedPayment.resident_id,
        month: parseInt(filterMonth),
        year: parseInt(filterYear)
      });
      toast.success("Payment rejected");
      setOpenVerify(false);
      setRejectReason('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const totalDue = payments
    .filter(p => p.status === 'PENDING' || p.status === 'REJECTED' || p.status === 'PARTIALLY_PAID')
    .reduce((a,c) => a + (c.status === 'PARTIALLY_PAID' ? Number(c.balance) : Number(c.amount)), 0);
    
  const totalCollected = payments
    .filter(p => p.status === 'PAID' || p.status === 'PARTIALLY_PAID')
    .reduce((a,c) => a + Number(c.amount_paid || 0), 0);

  const pendingCount = payments.filter(p => p.status === 'PENDING' || p.status === 'REJECTED' || p.status === 'PARTIALLY_PAID').length;
  const submittedCount = payments.filter(p => p.status === 'SUBMITTED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass-card p-6 rounded-2xl gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-emerald-600" />
            Rent Log & Payments
          </h1>
          <p className="text-slate-500 mt-1">Track collections and pending outstandings</p>
        </div>

        <div className="flex flex-wrap gap-2">
           <Select value={filterMonth} onValueChange={setFilterMonth}>
             <SelectTrigger className="w-32 sm:w-36"><SelectValue /></SelectTrigger>
             <SelectContent>
               {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={(i+1).toString()}>{m}</SelectItem>)}
             </SelectContent>
           </Select>
           <Select value={filterYear} onValueChange={setFilterYear}>
             <SelectTrigger className="w-20 sm:w-24"><SelectValue /></SelectTrigger>
             <SelectContent>
               {[2024,2025,2026,2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
             </SelectContent>
           </Select>
           <Select value={filterStatus} onValueChange={setFilterStatus}>
             <SelectTrigger className="w-28 sm:w-32"><SelectValue placeholder="All Status" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="ALL">All Status</SelectItem>
               <SelectItem value="PENDING">Pending</SelectItem>
               <SelectItem value="SUBMITTED">Submitted</SelectItem>
               <SelectItem value="PAID">Paid</SelectItem>
               <SelectItem value="REJECTED">Rejected</SelectItem>
             </SelectContent>
           </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
         <Card className="text-white border-none shadow-md shadow-emerald-500/20" style={{ background: 'linear-gradient(to bottom right, #10b981, #047857)' }}>
            <CardContent className="p-6">
               <p className="text-emerald-100 font-medium mb-1 text-sm uppercase tracking-wider">Collected</p>
               <h2 className="text-3xl font-extrabold">{formatCurrency(totalCollected)}</h2>
               <div className="mt-4 flex items-center gap-2 text-sm text-emerald-100/80">
                 <CheckCircle className="w-4 h-4" /> Cleared
               </div>
            </CardContent>
         </Card>
         <Card className="border-slate-100 shadow-md">
            <CardContent className="p-6">
               <p className="text-slate-500 font-medium mb-1 text-sm uppercase tracking-wider">Submitted</p>
               <h2 className="text-3xl font-extrabold text-blue-600">{submittedCount} Residents</h2>
               <div className="mt-4 flex items-center gap-2 text-sm text-blue-500 font-bold italic">
                 Requires Approval
               </div>
            </CardContent>
         </Card>
         <Card className="text-white border-none shadow-md shadow-red-500/20" style={{ background: 'linear-gradient(to bottom right, #ef4444, #b91c1c)' }}>
            <CardContent className="p-6">
               <p className="text-red-100 font-medium mb-1 text-sm uppercase tracking-wider">Outstanding</p>
               <h2 className="text-3xl font-extrabold">{formatCurrency(totalDue)}</h2>
               <div className="mt-4 flex items-center gap-2 text-sm text-red-100/80">
                 <AlertTriangle className="w-4 h-4" /> Due / Rejected
               </div>
            </CardContent>
         </Card>
         <Card className="text-white border-none shadow-md" style={{ background: '#1e293b' }}>
            <CardContent className="p-6 flex flex-col justify-center h-full">
               <div className="flex flex-col items-center text-center">
                 <span className="text-3xl font-extrabold text-blue-400">{pendingCount}</span>
                 <p className="text-slate-400 font-medium mt-1 uppercase text-[11px] tracking-widest">Defaulters</p>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100">
           <CardTitle className="flex justify-between items-center">
              <span>Ledger: {MONTH_NAMES[parseInt(filterMonth)-1]} {filterYear}</span>
              <span className="text-sm font-normal text-slate-500">{filteredPayments.length} records filtered</span>
           </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <p className="p-8 text-center text-slate-500">Loading ledger...</p>
          ) : filteredPayments.length === 0 ? (
             <div className="p-8 text-center text-slate-500">
               <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-3" />
               <p>No {filterStatus !== 'ALL' ? filterStatus.toLowerCase() : ''} payment records found.</p>
             </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPayments.map(p => {
                const isPaid = p.status === 'PAID';
                const isSubmitted = p.status === 'SUBMITTED';
                return (
                  <div key={p.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-slate-50 gap-4 transition-colors">
                    <div className="flex items-start gap-4">
                       <div className={cn(
                         "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                         isPaid ? 'bg-emerald-100 text-emerald-700' : isSubmitted ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                       )}>
                         {isPaid ? <CheckCircle className="w-6 h-6" /> : isSubmitted ? <Clock className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                       </div>
                       <div>
                         <h3 className="text-lg font-bold text-slate-900">{p.resident?.name || 'Unknown'}</h3>
                         <div className="text-sm text-slate-500 flex items-center gap-3 mt-1 font-medium">
                           <span>Flat: {p.resident?.room?.room_number || '-'}</span>
                           <span className="w-1 h-1 bg-slate-300 rounded-full" />
                           <span>{p.resident?.phone || '-'}</span>
                         </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-slate-100">
                    <div className="text-left md:text-right">
                       <div className="text-xl font-extrabold text-slate-900">{formatCurrency(p.amount)}</div>
                       <div className="flex flex-col items-end gap-1">
                        <Badge className={cn(getStatusColor(p.status), "font-bold uppercase text-[10px]")}>{p.status}</Badge>
                        {p.status === 'PARTIALLY_PAID' && (
                          <span className="text-[10px] text-red-500 font-bold">Bal: {formatCurrency(p.balance)}</span>
                        )}
                       </div>
                    </div>

                    {p.status !== 'PAID' && (
                      <Button onClick={() => openPaymentDialog(p)} className={cn("shadow-md h-10", isSubmitted ? "bg-blue-600 hover:bg-blue-700 font-bold" : "bg-emerald-600 hover:bg-emerald-700 font-bold")}>
                         {isSubmitted ? "Review Proof" : "Record Receipt"}
                      </Button>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(val) => { setDialogOpen(val); if(!val) form.reset(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment Received</DialogTitle></DialogHeader>
          {selectedPayment && (
             <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-500">Monthly Total Due:</span>
                     <span className="font-bold text-slate-700">{formatCurrency(selectedPayment.amount)}</span>
                   </div>
                   <div className="flex justify-between items-center text-lg">
                     <span className="text-slate-600 font-medium">Pending Balance:</span>
                     <span className="font-extrabold text-emerald-700">
                       {formatCurrency(selectedPayment.status === 'PARTIALLY_PAID' ? selectedPayment.balance : selectedPayment.amount)}
                     </span>
                   </div>
                 </div>
                 
                 <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount_paid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pay Amount Now *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                              <Input type="number" className="pl-9" placeholder="Enter amount being paid" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                          {selectedPayment && (
                             <p className="text-[11px] text-slate-500 italic mt-1">
                               Paying {formatCurrency(field.value)} of 
                               {formatCurrency(selectedPayment.status === 'PARTIALLY_PAID' ? selectedPayment.balance : selectedPayment.amount)}
                             </p>
                          )}
                        </FormItem>
                      )}
                    />
                   <FormField
                     control={form.control}
                     name="payment_mode"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Payment Method *</FormLabel>
                         <Select value={field.value} onValueChange={field.onChange}>
                           <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                           <SelectContent>
                             <SelectItem value="UPI">UPI / GPay / PayTM</SelectItem>
                             <SelectItem value="Cash">Physical Cash</SelectItem>
                             <SelectItem value="Bank">Bank Transfer (NEFT/IMPS)</SelectItem>
                           </SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="remarks"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Remarks / Ref No (Optional)</FormLabel>
                         <FormControl><Input placeholder="e.g. UTR Number or Cash Handover details" {...field} /></FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>

                 <div className="flex gap-3 pt-2">
                   <Button type="button" variant="outline" className="flex-1" onClick={()=>setDialogOpen(false)}>Cancel</Button>
                   <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={form.formState.isSubmitting}>Confirm Receipt</Button>
                 </div>
               </form>
             </Form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openVerify} onOpenChange={setOpenVerify}>
        <DialogContent className="max-w-md rounded-[28px]">
          <DialogHeader><DialogTitle className="text-xl font-bold">Verify Resident Payment</DialogTitle></DialogHeader>
          {selectedPayment && (
            <div className="space-y-6 py-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-inner">
                <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest mb-1">Transaction Reference</p>
                <p className="text-lg font-mono font-bold text-blue-900 break-all">{selectedPayment.transaction_ref || 'TRN-NOT-FOUND'}</p>
                <p className="text-[10px] text-blue-400 mt-2 font-medium italic">Submitted on {new Date(selectedPayment.submitted_at).toLocaleString()}</p>
              </div>

              {selectedPayment.screenshot_url && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-700">Digital Proof (Screenshot)</p>
                  <a href={selectedPayment.screenshot_url} target="_blank" rel="noreferrer" className="block relative group">
                    <img 
                      src={selectedPayment.screenshot_url} 
                      alt="Proof" 
                      className="w-full h-56 object-contain bg-slate-100 rounded-2xl border-2 border-slate-200"
                    />
                    <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                      <span className="bg-white text-blue-600 px-4 py-2 rounded-full font-bold text-xs shadow-lg">View Full Screen</span>
                    </div>
                  </a>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-slate-100">
                 <div className="space-y-2">
                   <Label className="text-slate-600 font-bold">Rejection Note (Shown to resident)</Label>
                   <Input 
                     placeholder="e.g. Reference ID mismatch / Partial amount paid" 
                     value={rejectReason}
                     onChange={e => setRejectReason(e.target.value)}
                     className="bg-slate-50 border-slate-200 rounded-xl"
                   />
                 </div>
                 
                 <div className="flex gap-3">
                   <Button 
                     variant="outline" 
                     className="flex-1 text-red-600 border-red-200 hover:bg-red-50 font-bold rounded-xl h-12"
                     onClick={handleReject}
                   >
                     Reject
                   </Button>
                   <Button 
                     className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200 h-12 rounded-xl flex items-center justify-center gap-2"
                     onClick={handleApprove}
                   >
                     <CheckCircle className="w-5 h-5" /> Approve & Record
                   </Button>
                 </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
