import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
export const useQuerySubContas = () => {
    return useQuery({
        queryKey: ['sub-contas'],
        queryFn: async () => getApiData('usuarios?page=1&limit=100'),
    });
};
