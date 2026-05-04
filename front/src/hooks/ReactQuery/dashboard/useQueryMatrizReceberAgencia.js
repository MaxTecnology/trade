import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
export const useQueryMatrizReceberAgencia = () => {
    return useQuery({
        queryKey: ['matrizReceberAgencia'],
        queryFn: async () => getApiData('cobrancas/minhas?page=1&limit=100'),
    });
};
