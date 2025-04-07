import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '#/services/supabase';

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ subscriptionId }: { subscriptionId: string }) => {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        method: 'POST',
        body: { subscription_id: subscriptionId },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries when subscription is canceled
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    },
  });
};