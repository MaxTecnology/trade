import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '@/hooks/ListasHook';
export const useQueryMatrizReceberAgencia = () => {
    return useQuery({
        queryKey: ['matrizReceberAgencia'],
        queryFn: async () => getApiDataAllPages('cobrancas/minhas?page=1&limit=100'),
    });
};
