import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useActiveCrops() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activeCrops', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crop_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 300000,
    refetchInterval: 60000,
  });
}

export function useCalendarEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['calendarEvents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user!.id)
        .order('event_date', { ascending: true });
      if (error) throw error;
      console.log('Calendar Events:', data?.length, data);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 300000,
    refetchInterval: 60000,
  });
}

export function useDeleteCrop() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (cropId: string) => {
      // Get crop name first to delete associated events + notifications
      const { data: cropData } = await supabase
        .from('crop_history')
        .select('crop_name')
        .eq('id', cropId)
        .single();

      const cropName = cropData?.crop_name;

      if (cropName && user?.id) {
        // Delete associated calendar events
        await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', user.id)
          .eq('crop_name', cropName);

        // Delete pending/unread smart notifications that reference this crop
        // (match by message contains crop name OR action_data.crop_name = crop name)
        await supabase
          .from('smart_notifications')
          .delete()
          .eq('user_id', user.id)
          .eq('read', false)
          .ilike('message', `%${cropName}%`);

        await supabase
          .from('smart_notifications')
          .delete()
          .eq('user_id', user.id)
          .eq('read', false)
          .ilike('title', `%${cropName}%`);

        // Also clean basic notifications table if it has crop references
        try {
          await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id)
            .ilike('message', `%${cropName}%`);
        } catch {}
      }

      // Delete crop history entry
      const { error: histError } = await supabase
        .from('crop_history')
        .delete()
        .eq('id', cropId)
        .eq('user_id', user!.id);
      if (histError) throw histError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeCrops'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      queryClient.invalidateQueries({ queryKey: ['smartNotifications'] });
      toast.success('Crop and related reminders removed');
    },
    onError: (err) => {
      console.error('Delete crop error:', err);
      toast.error('Failed to remove crop');
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({ completed: true })
        .eq('id', taskId);
      if (error) throw error;
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['calendarEvents'] });
      const previous = queryClient.getQueryData(['calendarEvents', user?.id]);
      queryClient.setQueryData(['calendarEvents', user?.id], (old: any[]) =>
        old?.map(t => t.id === taskId ? { ...t, completed: true } : t)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['calendarEvents', user?.id], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
    },
  });
}

export function useAllCropsFromDB() {
  return useQuery({
    queryKey: ['allCropsDB'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 600000,
  });
}
