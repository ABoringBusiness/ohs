import { useMutation } from '@tanstack/react-query';
import { supabase } from '#/services/supabase';

export const useCreateStripeCustomerPortal = () =>
  useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-customer-portal-session', {
        method: 'POST',
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.url) {
        window.location.href = data.url;
        return data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    },
  });