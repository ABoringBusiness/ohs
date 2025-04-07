import { useQuery } from '@tanstack/react-query';
import { supabase, UserProfile } from '#/services/supabase';
import { useSupabaseUser } from './use-supabase-user';

export const useUserProfile = () => {
  const { data: user } = useSupabaseUser();
  
  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data as UserProfile;
    },
    enabled: !!user?.id,
  });
};