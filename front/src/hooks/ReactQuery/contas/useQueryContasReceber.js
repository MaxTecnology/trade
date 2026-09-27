import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '@/hooks/ListasHook';

export const useQueryContasReceber = (enabled = true) => {
    return useQuery({
        queryKey: ['contasReceber'],
        queryFn: async () => getApiDataAllPages('cobrancas/minhas?direcao=receber&page=1&limit=100'),
        enabled,
    });
};
