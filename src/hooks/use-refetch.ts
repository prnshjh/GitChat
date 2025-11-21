// src/hooks/use-refetch.ts
import { useQueryClient } from '@tanstack/react-query';

const useRefetch = () => {
    const queryClient = useQueryClient();

    return async () => {
        try {
            // Invalidate all queries first
            await queryClient.invalidateQueries({
                type: 'active',
            });
            
            // Then refetch them
            await queryClient.refetchQueries({
                type: 'active',
            });
            
            return true;
        } catch (error) {
            console.error('Error refetching queries:', error);
            return false;
        }
    };
};

export default useRefetch;