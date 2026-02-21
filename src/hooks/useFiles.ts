import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bkend } from '@/lib/bkend';
import type { SharedFile } from '@/types';

export function useFiles(teamId: string) {
  const queryClient = useQueryClient();

  const {
    data: files = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['files', teamId],
    queryFn: async () => {
      const result = await bkend.collection('files').find({});
      const all = Array.isArray(result) ? (result as SharedFile[]) : [];
      return all.filter((f) => f.teamId === teamId);
    },
    enabled: !!teamId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['files', teamId] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await bkend.collection('files').delete(fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', teamId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      fileId,
      data,
    }: {
      fileId: string;
      data: Partial<SharedFile>;
    }) => {
      return (await bkend
        .collection('files')
        .update(fileId, data as Record<string, unknown>)) as SharedFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', teamId] });
    },
  });

  const deleteFile = async (fileId: string) => {
    await deleteMutation.mutateAsync(fileId);
  };

  const updateFile = async (fileId: string, data: Partial<SharedFile>) => {
    await updateMutation.mutateAsync({ fileId, data });
  };

  return {
    files,
    isLoading,
    isError,
    refetch,
    refresh,
    deleteFile,
    updateFile,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
