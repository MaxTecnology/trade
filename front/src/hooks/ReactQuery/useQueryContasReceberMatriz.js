import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
import { getId } from '../getId';
export const useQueryContasReceberMatriz = () => {
    return useQuery({
        queryKey: ['receberMatriz'],
        queryFn: async () => getApiData(`dashboard/receita-matriz/${getId()}`),
    });
};


