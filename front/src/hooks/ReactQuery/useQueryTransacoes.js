import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryTransacoes = () => {
    return useQuery({
        queryKey: ['transacoes'],
        queryFn: async () => getApiData('transacoes?page=1&limit=100'),
    });
};
