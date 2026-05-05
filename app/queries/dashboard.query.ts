import { createQuery } from 'react-query-kit';
import { supabase, unwrapSupabaseResponse } from './utils';
import { MONTH_NAMES, formatMonthYear } from '~/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  activeResidents: number;
  pendingApprovals: number;
  vacatedThisMonth: number;
  collectionsThisMonth: number;
  outstandings: number;
}

export interface RevenueTrendItem {
  month: string;
  revenue: number;
  expenses: number;
}

export interface OccupancyTrendItem {
  week: string;
  active: number;
}

export interface OccupancyDataItem {
  name: string;
  value: number;
}

export interface AdminDashboardData {
  stats: DashboardStats;
  revenueTrend: RevenueTrendItem[];
  occupancyTrend: OccupancyTrendItem[];
  occupancyData: OccupancyDataItem[];
}

// ─── Query Keys ───────────────────────────────────────────────────────────

export const dashboardKeys = {
  admin: (adminId: string) => ['dashboard', 'admin', adminId] as const,
  superAdmin: ['dashboard', 'superAdmin'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────

/** Fetch all dashboard data for admin in a single query */
export const useAdminDashboard = createQuery<AdminDashboardData, { adminId?: string; buildingIds?: string[] }>({
  queryKey: ['dashboard'],
  fetcher: async (variables) => {
    let bIds: string[] = variables.buildingIds || [];
    
    if (bIds.length === 0 && variables.adminId) {
      const { data: bldgs } = await supabase.from('buildings').select('id').eq('admin_id', variables.adminId);
      bIds = bldgs?.map((b) => b.id) || [];
    }

    if (bIds.length === 0) {
      return {
        stats: { activeResidents: 0, pendingApprovals: 0, vacatedThisMonth: 0, collectionsThisMonth: 0, outstandings: 0 },
        revenueTrend: [],
        occupancyTrend: [],
        occupancyData: [],
      };
    }

    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    const { data: allResData } = await supabase.from('residents').select('id, join_date, vacate_date, status').in('building_id', bIds);
    const rIds = (allResData || []).map((r) => r.id);

    const [
      { count: activeCount },
      { count: pendingCount },
      { count: vacatedCount },
      { data: payments },
      { data: outRes },
      { data: allPayments },
      { data: allExpenses },
    ] = await Promise.all([
      supabase.from('residents').select('*', { count: 'exact', head: true }).in('building_id', bIds).eq('status', 'ACTIVE'),
      supabase.from('residents').select('*', { count: 'exact', head: true }).in('building_id', bIds).eq('status', 'PENDING'),
      supabase.from('residents').select('*', { count: 'exact', head: true }).in('building_id', bIds).eq('status', 'VACATED').gte('vacate_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
      supabase.from('payments').select('amount').in('resident_id', rIds).eq('month', formatMonthYear(curMonth, curYear)).eq('status', 'PAID'),
      supabase.from('payments').select('amount').in('resident_id', rIds).eq('month', formatMonthYear(curMonth, curYear)).eq('status', 'PENDING'),
      supabase.from('payments').select('amount, month').in('resident_id', rIds).eq('status', 'PAID'),
      supabase.from('expenses').select('amount, date').in('building_id', bIds),
    ]);

    const totalCollected = payments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
    const totalOutstanding = outRes?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

    const stats: DashboardStats = {
      activeResidents: activeCount || 0,
      pendingApprovals: pendingCount || 0,
      vacatedThisMonth: vacatedCount || 0,
      collectionsThisMonth: totalCollected,
      outstandings: totalOutstanding,
    };

    const occupancyData: OccupancyDataItem[] = [
      { name: 'Active', value: activeCount || 0 },
      { name: 'Waiting', value: pendingCount || 0 },
      { name: 'Vacated', value: vacatedCount || 0 },
    ];

    // Revenue vs Expenses Trend (Last 6 Months)
    const months = MONTH_NAMES;
    const revenueTrend: RevenueTrendItem[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const checkLabel = formatMonthYear(m, y);
      const monthRevenue = allPayments?.filter((p) => p.month === checkLabel).reduce((acc, p) => acc + Number(p.amount), 0) || 0;
      const monthExpenses = allExpenses?.filter((e) => {
        const ed = new Date(e.date);
        return ed.getMonth() + 1 === m && ed.getFullYear() === y;
      }).reduce((acc, e) => acc + Number(e.amount), 0) || 0;
      revenueTrend.push({ month: months[m - 1], revenue: monthRevenue, expenses: monthExpenses });
    }

    // Occupancy Trend
    const allResidents = allResData || [];
    const occupancyTrend: OccupancyTrendItem[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
      const activeAtTime = allResidents.filter((r) => {
        const jd = r.join_date ? new Date(r.join_date) : null;
        const vd = r.vacate_date ? new Date(r.vacate_date) : null;
        if (!jd) return false;
        return jd <= d && (!vd || vd > d);
      }).length;
      occupancyTrend.push({ week: `W${4 - i}`, active: activeAtTime });
    }

    return { stats, revenueTrend, occupancyTrend, occupancyData };
  },
});

// ─── Super Admin Dashboard ────────────────────────────────────────────────

export interface SuperAdminStats {
  buildings: number;
  admins: number;
  locations: number;
  residents: number;
}

export const useSuperAdminDashboard = createQuery<SuperAdminStats>({
  queryKey: dashboardKeys.superAdmin,
  fetcher: async () => {
    const [
      { count: bCount },
      { count: aCount },
      { count: lCount },
      { count: rCount },
    ] = await Promise.all([
      supabase.from('buildings').select('*', { count: 'exact', head: true }),
      supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN'),
      supabase.from('cities').select('*', { count: 'exact', head: true }),
      supabase.from('residents').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    ]);
    return {
      buildings: bCount || 0,
      admins: aCount || 0,
      locations: lCount || 0,
      residents: rCount || 0,
    };
  },
});

// ─── Reports ──────────────────────────────────────────────────────────────

export interface MonthlyReportItem {
  month: string;
  shortMonth: string;
  income: number;
  expense: number;
  profit: number;
}

export const useFinancialReports = createQuery<MonthlyReportItem[], { adminId?: string; buildingIds?: string[]; year: number }>({
  queryKey: ['reports'],
  fetcher: async (variables) => {
    let bIds: string[] = variables.buildingIds || [];
    
    if (bIds.length === 0 && variables.adminId) {
      const { data: bldgs } = await supabase.from('buildings').select('id').eq('admin_id', variables.adminId);
      bIds = bldgs?.map((b) => b.id) || [];
    }

    if (bIds.length === 0) return [];

    const resBase = await supabase.from('residents').select('id').in('building_id', bIds);
    const resIds = (resBase.data || []).map((r) => r.id);

    const [{ data: paymentsData }, { data: expensesData }] = await Promise.all([
      supabase.from('payments').select('month, amount').in('resident_id', resIds).gte('month', `${variables.year}-01`).lte('month', `${variables.year}-12`).eq('status', 'PAID'),
      supabase.from('expenses').select('date, amount').in('building_id', bIds).gte('date', `${variables.year}-01-01`).lte('date', `${variables.year}-12-31`),
    ]);

    return MONTH_NAMES.map((name, index) => {
      const m = index + 1;
      const checkLabel = formatMonthYear(m, variables.year);
      const income = paymentsData?.filter((p) => p.month === checkLabel).reduce((a, c) => a + Number(c.amount), 0) || 0;
      const expense = expensesData?.filter((e) => new Date(e.date).getMonth() + 1 === m).reduce((a, c) => a + Number(c.amount), 0) || 0;
      return { month: name, shortMonth: name.slice(0, 3), income, expense, profit: income - expense };
    });
  },
});
