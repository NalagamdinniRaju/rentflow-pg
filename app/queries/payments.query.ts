import { createQuery, createMutation } from 'react-query-kit';
import { supabase, unwrapSupabaseResponse } from './utils';
import { queryClient } from './client';
import type { Database } from '~/lib/supabase';
import { formatMonthYear } from '~/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────

type PaymentRow = Database['public']['Tables']['payments']['Row'];

export interface PaymentWithResident extends PaymentRow {
  resident: {
    id: string;
    name: string;
    phone: string;
    room_id: string;
    room: { room_number: string } | null;
    building?: { name: string } | null;
  } | null;
}

// ─── Query Keys ───────────────────────────────────────────────────────────

export const paymentKeys = {
  all: ['payments'] as const,
  byResident: (residentId: string) => [...paymentKeys.all, 'resident', residentId] as const,
  byMonth: (monthLabel: string) => [...paymentKeys.all, 'month', monthLabel] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────

interface PaymentsQueryVariables {
  buildingIds: string[];
  month: number;
  year: number;
}

/** Fetch payments for a given month/year across building IDs (admin view) */
export const useMonthlyPayments = createQuery<PaymentWithResident[], PaymentsQueryVariables>({
  queryKey: ['monthly-payments'], // Will be extended with variables in hook
  fetcher: async (variables) => {
    if (variables.buildingIds.length === 0) return [];

    // 1. Get ALL active monthly residents for these buildings
    const { data: activeRes } = await supabase
      .from('residents')
      .select('id, name, phone, room_id, monthly_rent, outstanding_balance, room:rooms(room_number), building:buildings(name)')
      .in('building_id', variables.buildingIds)
      .eq('status', 'ACTIVE')
      .eq('stay_type', 'MONTHLY');

    if (!activeRes || activeRes.length === 0) return [];

    const residentIds = activeRes.map(r => r.id);

    const monthLabel = formatMonthYear(variables.month, variables.year);

    // 2. Fetch any existing payment records for these residents in the selected period
    const { data: realPayments } = await supabase
      .from('payments')
      .select(`
        *,
        resident:residents(id, name, phone, room_id, room:rooms(room_number))
      `)
      .in('resident_id', residentIds)
      .eq('month', monthLabel);

    // 3. Merge: If a resident has no payment record, create a virtual PENDING one
    const merged = activeRes.map(res => {
      const real = realPayments?.find(p => p.resident_id === res.id);
      if (real) return real;
      
      // Virtual entry
      return {
        id: `virtual-${res.id}`,
        resident_id: res.id,
        amount: Number(res.monthly_rent || 0) + Number(res.outstanding_balance || 0), 
        amount_paid: 0,
        balance: Number(res.monthly_rent || 0) + Number(res.outstanding_balance || 0),
        status: 'PENDING',
        month: monthLabel,
        resident: res,
        created_at: new Date().toISOString()
      };
    });

    return (merged || []) as PaymentWithResident[];
  },
});

/** Fetch payment history for a single resident */
export const useResidentPayments = createQuery<PaymentRow[], { residentId: string }>({
  queryKey: paymentKeys.all,
  fetcher: async (variables) => {
    const response = await supabase
      .from('payments')
      .select('*')
      .eq('resident_id', variables.residentId)
      .order('month', { ascending: false });
    return unwrapSupabaseResponse(response) as PaymentRow[];
  },
});

/** Fetch payments for resident's own view (by user_id, needs resident lookup) */
export const useMyPayments = createQuery<PaymentRow[], { userId: string }>({
  queryKey: paymentKeys.all,
  fetcher: async (variables) => {
    const { data: resData } = await supabase
      .from('residents')
      .select('id')
      .eq('user_id', variables.userId)
      .maybeSingle();

    if (!resData) return [];

    const response = await supabase
      .from('payments')
      .select('*, resident:residents(name, phone, room:rooms(room_number))')
      .eq('resident_id', resData.id)
      .order('created_at', { ascending: false });
    return unwrapSupabaseResponse(response) as PaymentWithResident[];
  },
});

/** Fetch defaulters (pending payments for reminders page) */
export const useDefaulters = createQuery<PaymentWithResident[], { buildingIds: string[]; month: number; year: number }>({
  queryKey: paymentKeys.all,
  fetcher: async (variables) => {
    if (!variables.buildingIds || variables.buildingIds.length === 0) return [];

    const { data: resData } = await supabase
      .from('residents')
      .select('id')
      .in('building_id', variables.buildingIds);

    const residentIds = resData?.map((r) => r.id) || [];
    if (residentIds.length === 0) return [];

    const response = await supabase
      .from('payments')
      .select(`
        *,
        resident:residents(id, name, phone, room:rooms(room_number), building:buildings(name, upi_id, upi_name, qr_code_url))
      `)
      .in('resident_id', residentIds)
      .eq('status', 'PENDING')
      .eq('month', formatMonthYear(variables.month, variables.year));

    return unwrapSupabaseResponse(response) as PaymentWithResident[];
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────

interface MarkPaymentPaidVariables {
  paymentId: string;
}

export const useVerifyPayment = createMutation<void, { paymentId: string; month?: number; year?: number; resident_id?: string }>({
  mutationFn: async (variables) => {
    const isVirtual = variables.paymentId.startsWith('virtual-');
    if (isVirtual) {
       await supabase.from('payments').insert({
         resident_id: variables.resident_id,
         month: formatMonthYear(variables.month!, variables.year!),
         amount: 0, // Should be fetched from resident initially, handled by admin
         status: 'PAID',
         paid_at: new Date().toISOString(),
         paid_date: new Date().toISOString().split('T')[0],
         payment_mode: 'UPI',
       });
    } else {
       await supabase.from('payments').update({
         status: 'PAID',
         paid_at: new Date().toISOString(),
         paid_date: new Date().toISOString().split('T')[0],
         payment_mode: 'UPI',
       }).eq('id', variables.paymentId);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['monthly-payments'] });
  },
});

export const useRejectPayment = createMutation<void, { paymentId: string; remarks: string; resident_id?: string; month?: number; year?: number }>({
  mutationFn: async (variables) => {
    const isVirtual = variables.paymentId.startsWith('virtual-');
    if (isVirtual) {
      await supabase.from('payments').insert({
        resident_id: variables.resident_id,
        month: formatMonthYear(variables.month!, variables.year!),
        status: 'REJECTED',
        remarks: variables.remarks,
      });
    } else {
      await supabase.from('payments').update({
        status: 'REJECTED',
        remarks: variables.remarks,
      }).eq('id', variables.paymentId);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['monthly-payments'] });
  },
});

interface SubmitPaymentVariables {
  paymentId: string;
  transactionRef: string;
  screenshotUrl?: string;
}

export const useSubmitPayment = createMutation<void, SubmitPaymentVariables>({
  mutationFn: async (variables) => {
    const response = await supabase.from('payments').update({
      status: 'SUBMITTED',
      transaction_ref: variables.transactionRef,
      screenshot_url: variables.screenshotUrl,
      submitted_at: new Date().toISOString(),
    }).eq('id', variables.paymentId);
    unwrapSupabaseResponse(response);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: paymentKeys.all });
  },
});

export const useUpdatePaymentStatus = createMutation<void, { 
  paymentId: string; 
  resident_id: string; 
  amount_due: number; 
  amount_paid: number; 
  payment_mode: string; 
  remarks?: string; 
  month: string; 
  status: 'PAID' | 'PARTIALLY_PAID';
}>({
  mutationFn: async (variables) => {
    const { error } = await supabase.rpc('handle_payment_update', {
      p_payment_id: variables.paymentId,
      p_resident_id: variables.resident_id,
      p_amount_due: variables.amount_due,
      p_payment_increment: variables.amount_paid,
      p_payment_mode: variables.payment_mode,
      p_remarks: variables.remarks || null,
      p_month: variables.month,
      p_status: variables.status
    });
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['monthly-payments'] });
  },
});

export const useMarkPaymentPaid = createMutation<void, { paymentId: string; payment_mode: any; remarks: any; resident_id?: string; month?: string; amount?: number }>({
  mutationFn: async (variables) => {
    const isVirtual = variables.paymentId.startsWith('virtual-');
    if (isVirtual) {
      await supabase.from('payments').insert({
        resident_id: variables.resident_id!,
        month: variables.month!,
        status: 'PAID',
        paid_date: new Date().toISOString().split('T')[0],
        paid_at: new Date().toISOString(),
        payment_mode: variables.payment_mode,
        remarks: variables.remarks,
        amount: variables.amount!,
        amount_paid: variables.amount!,
        balance: 0
      });
    } else {
      await supabase.from('payments').update({
        status: 'PAID',
        paid_date: new Date().toISOString().split('T')[0],
        paid_at: new Date().toISOString(),
        payment_mode: variables.payment_mode,
        remarks: variables.remarks,
        amount_paid: variables.amount || 0,
        balance: 0
      }).eq('id', variables.paymentId);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['monthly-payments'] });
  },
});

// ─── Invalidation helpers ─────────────────────────────────────────────────

export function invalidatePayments() {
  queryClient.invalidateQueries({ queryKey: paymentKeys.all });
}
