import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryContasReceberMatriz = () => {
    return useQuery({
        queryKey: ['receberMatriz'],
        queryFn: async () => getApiData('cobrancas?page=1&limit=100'),
    });
};
