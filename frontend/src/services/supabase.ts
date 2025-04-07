import { createClient } from '@supabase/supabase-js';

// These would typically come from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Supabase functionality will not work properly.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
};

export type UserProfile = {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  credits: number;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export type UserSubscription = {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';
  current_period_end: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
};

export type PaymentHistory = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  payment_method: string;
  stripe_payment_intent_id?: string;
  created_at: string;
};