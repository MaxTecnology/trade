import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
export const useQueryProximaFatura = () => {
    return useQuery({
        queryKey: ['proximaFatura'],
        queryFn: async () => getApiData('cobrancas/minhas?pago=false&page=1&limit=1'),
    });
};
