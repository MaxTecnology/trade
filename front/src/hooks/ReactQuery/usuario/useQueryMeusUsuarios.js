import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
export const useQueryMeusUsuarios = () => {
    return useQuery({
        queryKey: ['myUsers'],
        queryFn: async () => getApiData('usuarios?page=1&limit=100'),
    });
};
