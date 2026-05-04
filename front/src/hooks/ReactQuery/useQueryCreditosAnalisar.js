import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryCreditosAnalisar = () => {
    return useQuery({
        queryKey: ['creditosAnalisar'],
        queryFn: async () => getApiData('creditos/filhos?page=1&limit=100'),
    });
};
