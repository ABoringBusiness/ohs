import { useQuery } from '@tanstack/react-query';
import { supabase, SupabaseUser } from '#/services/supabase';

export const useSupabaseUser = () => {
  return useQuery({
    queryKey: ['supabase-user'],
    queryFn: async (): Promise<SupabaseUser | null> => {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error fetching Supabase user:', error);
        return null;
      }
      
      return data?.user || null;
    },
  });
};