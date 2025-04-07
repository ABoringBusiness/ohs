import { useQuery } from '@tanstack/react-query';
import { supabase, PaymentHistory } from '#/services/supabase';
import { useSupabaseUser } from './use-supabase-user';

export const usePaymentHistory = () => {
  const { data: user } = useSupabaseUser();
  
  return useQuery({
    queryKey: ['payment-history', user?.id],
    queryFn: async (): Promise<PaymentHistory[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }
      
      return data as PaymentHistory[];
    },
    enabled: !!user?.id,
  });
};