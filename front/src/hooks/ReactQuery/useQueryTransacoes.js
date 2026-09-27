import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '../ListasHook';
export const useQueryTransacoes = () => {
    return useQuery({
        queryKey: ['transacoes'],
        queryFn: async () => getApiDataAllPages('transacoes?page=1&limit=100'),
    });
};
