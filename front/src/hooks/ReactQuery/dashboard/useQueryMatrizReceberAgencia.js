import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
import { getId } from '@/hooks/getId';
export const useQueryMatrizReceberAgencia = () => {
    return useQuery({
        queryKey: ['matrizReceberAgencia'],
        queryFn: async () => getApiData(`dashboard/receita-agencia/${getId()}`),
    });
};
