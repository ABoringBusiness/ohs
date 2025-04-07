import { useQuery } from '@tanstack/react-query';
import { supabase, UserSubscription } from '#/services/supabase';
import { useSupabaseUser } from './use-supabase-user';

export const useUserSubscription = () => {
  const { data: user } = useSupabaseUser();
  
  return useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async (): Promise<UserSubscription | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching user subscription:', error);
        return null;
      }
      
      return data as UserSubscription;
    },
    enabled: !!user?.id,
  });
};