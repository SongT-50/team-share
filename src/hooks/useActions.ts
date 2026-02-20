import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bkend } from '@/lib/bkend';
import type { ActionItem, ActionStatus } from '@/types';

export function useActions(teamId: string) {
  const queryClient = useQueryClient();

  const { data: actions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['actions', teamId],
    queryFn: async () => {
      const result = await bkend.collection('action-items').find({ teamId });
      return Array.isArray(result) ? (result as ActionItem[]) : [];
    },
    enabled: !!teamId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ActionStatus }) => {
      return bkend.collection('action-items').update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', teamId] });
    },
  });

  const updateActionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ActionItem> }) => {
      return bkend.collection('action-items').update(id, data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', teamId] });
    },
  });

  const deleteActionMutation = useMutation({
    mutationFn: async (id: string) => {
      return bkend.collection('action-items').delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', teamId] });
    },
  });

  const todos = actions.filter((a) => a.actionType === 'todo');
  const decisions = actions.filter((a) => a.actionType === 'decision');
  const ideas = actions.filter((a) => a.actionType === 'idea');

  const openTodos = todos.filter((t) => t.status !== 'done');
  const doneTodos = todos.filter((t) => t.status === 'done');
  const todoProgress = todos.length > 0 ? Math.round((doneTodos.length / todos.length) * 100) : 0;

  return {
    actions,
    todos,
    decisions,
    ideas,
    openTodos,
    doneTodos,
    todoProgress,
    isLoading,
    isError,
    refetch,
    updateStatus: updateStatusMutation.mutate,
    updateAction: async (id: string, data: Partial<ActionItem>) => {
      await updateActionMutation.mutateAsync({ id, data });
    },
    deleteAction: async (id: string) => {
      await deleteActionMutation.mutateAsync(id);
    },
    isUpdating: updateActionMutation.isPending,
    isDeleting: deleteActionMutation.isPending,
  };
}
