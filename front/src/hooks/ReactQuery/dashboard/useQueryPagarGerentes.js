import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
import { getId } from '@/hooks/getId';
export const useQueryPagarGerentes = () => {
    return useQuery({
        queryKey: ['pagarGerentes'],
        queryFn: async () => getApiData(`dashboard/a-pagar-todos-gerentes/${getId()}`),
    });
};
