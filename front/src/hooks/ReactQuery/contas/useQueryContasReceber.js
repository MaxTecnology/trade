import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';

export const useQueryContasReceber = (enabled = true) => {
    return useQuery({
        queryKey: ['contasReceber'],
        queryFn: async () => getApiData('cobrancas/minhas?direcao=receber&page=1&limit=100'),
        enabled,
    });
};
