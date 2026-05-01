import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
import { getId } from '@/hooks/getId';
export const useQueryProximaFatura = () => {
    return useQuery({
        queryKey: ['proximaFatura'],
        queryFn: async () => getApiData(`cobrancas/listar-proxima-fatura/${getId()}`),
    });
};
