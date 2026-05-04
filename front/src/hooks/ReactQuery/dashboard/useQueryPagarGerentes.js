import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
export const useQueryPagarGerentes = () => {
    return useQuery({
        queryKey: ['pagarGerentes'],
        queryFn: async () => getApiData('relatorios/comissoes-gerentes'),
    });
};
