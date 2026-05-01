
import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
import { getId } from '../getId';
export const useQueryCreditosAnalisar = () => {
    return useQuery({
        queryKey: ['creditosAnalisar'],
        queryFn: async () => getApiData(`creditos/listar-filhos/${getId()}?page=1&pageSize=100`),
    });
};
