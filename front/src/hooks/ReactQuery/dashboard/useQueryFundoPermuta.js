import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
import { getId } from '@/hooks/getId';
export const useQueryFundoPermuta = () => {
    return useQuery({
        queryKey: ['fundoPermutaUnidade'],
        queryFn: async () => getApiData(`dashboard/fundo-permuta-unidade/${getId()}`),
    });
};
