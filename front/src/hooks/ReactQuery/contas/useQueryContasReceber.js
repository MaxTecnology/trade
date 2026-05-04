import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
export const useQueryContasReceber = () => {
    return useQuery({
        queryKey: ['contasReceber'],
        queryFn: async () => getApiData('cobrancas/minhas?page=1&limit=100'),
    });
};
