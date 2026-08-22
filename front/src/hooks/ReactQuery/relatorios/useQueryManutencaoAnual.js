import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';

export const useQueryManutencaoAnual = () => {
    return useQuery({
        queryKey: ['manutencaoAnual'],
        queryFn: async () => getApiData('cobrancas/manutencao-anual'),
    });
};
