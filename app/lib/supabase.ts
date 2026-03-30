import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'SUPER_ADMIN' | 'ADMIN' | 'RESIDENT';
          name: string | null;
          phone: string | null;
          status: 'ACTIVE' | 'INACTIVE';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_roles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>;
      };
      buildings: {
        Row: {
          id: string;
          admin_id: string | null;
          name: string;
          location: string | null;
          status: 'ACTIVE' | 'INACTIVE';
          created_at: string;
          address_id: string | null;
        };
      };
      floors: {
        Row: {
          id: string;
          building_id: string;
          floor_number: string;
          created_at: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          floor_id: string;
          room_number: string;
          total_seats: number;
          custom_rent: number | null;
          created_at: string;
        };
      };
      seats: {
        Row: {
          id: string;
          room_id: string;
          seat_number: string;
          status: 'AVAILABLE' | 'OCCUPIED';
          created_at: string;
        };
      };
      residents: {
        Row: {
          id: string;
          user_id: string | null;
          building_id: string;
          floor_id: string | null;
          room_id: string | null;
          seat_id: string | null;
          name: string;
          phone: string;
          email: string | null;
          stay_type: 'MONTHLY' | 'DAILY' | null;
          daily_rent: number | null;
          photo: string | null;
          aadhar_photo: string | null;
          join_date: string | null;
          monthly_rent: number | null;
          deposit_amount: number | null;
          deposit_received_date: string | null;
          deposit_status: 'HOLDING' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
          status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'VACATED' | 'UPCOMING';
          vacate_date: string | null;
          address: string | null;
          emergency_contact_phone: string | null;
          created_at: string;
          address_id: string | null;
          outstanding_balance: number;
        };
      };
      payments: {
        Row: {
          id: string;
          resident_id: string;
          month: string;
          amount: number;
          amount_paid: number;
          balance: number;
          status: 'PENDING' | 'SUBMITTED' | 'PAID' | 'PARTIALLY_PAID' | 'REJECTED';
          paid_date: string | null;
          payment_mode: 'Cash' | 'UPI' | 'Bank' | null;
          remarks: string | null;
          created_at: string;
          transaction_ref?: string | null;
          screenshot_url?: string | null;
          submitted_at?: string | null;
          paid_at?: string | null;
        };
      };
      expenses: {
        Row: {
          id: string;
          building_id: string;
          type: 'RENT' | 'ELECTRICITY' | 'MAINTENANCE' | 'OTHER';
          amount: number;
          date: string;
          description: string | null;
          created_at: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          resident_id: string;
          payment_id: string;
          sent_date: string;
          channel: 'SMS' | 'WhatsApp' | 'Email';
          status: 'SENT' | 'FAILED';
          created_at: string;
        };
      };
      states: {
        Row: {
          id: string;
          name: string;
          created_at: string | null;
        };
      };
      cities: {
        Row: {
          id: string;
          state_id: string;
          name: string;
          created_at: string | null;
        };
      };
      addresses: {
        Row: {
          id: string;
          line_one: string;
          line_two: string | null;
          pincode: string | null;
          city_id: string;
          created_at: string | null;
        };
      };
      system_settings: {
        Row: {
          id: string;
          default_monthly_rent: number;
          default_daily_rent: number;
          default_deposit: number;
          late_fee: number;
          reminder_days: number;
          financial_year_start_month: number;
          created_at: string;
        };
      };
    };
  };
};
