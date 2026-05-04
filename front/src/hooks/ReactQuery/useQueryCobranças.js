import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryCobranças = () => {
    return useQuery({
        queryKey: ['cobranças'],
        queryFn: async () => getApiData('cobrancas/minhas?page=1&limit=100'),
    });
};
