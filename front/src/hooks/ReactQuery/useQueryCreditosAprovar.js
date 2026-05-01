
import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryCreditosAprovar = () => {
    return useQuery({
        queryKey: ['creditosAprovar'],
        queryFn: async () => getApiData(`creditos/matriz/analisar?page=1&pageSize=100`),
    });
};
