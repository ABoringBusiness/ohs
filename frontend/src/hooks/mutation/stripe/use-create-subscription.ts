import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '#/services/supabase';

type SubscriptionPlan = 'basic' | 'pro' | 'enterprise';

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ plan, successUrl, cancelUrl }: { 
      plan: SubscriptionPlan; 
      successUrl: string; 
      cancelUrl: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        method: 'POST',
        body: { plan, success_url: successUrl, cancel_url: cancelUrl },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.url) {
        window.location.href = data.url;
        return data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries when subscription is created
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};