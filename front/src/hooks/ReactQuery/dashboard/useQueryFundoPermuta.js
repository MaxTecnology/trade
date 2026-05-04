import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
export const useQueryFundoPermuta = () => {
    return useQuery({
        queryKey: ['fundoPermutaUnidade'],
        queryFn: async () => getApiData('extrato/saldo'),
    });
};
