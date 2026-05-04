import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryOfertas = () => {
    return useQuery({
        queryKey: ['ofertas'],
        queryFn: async () => getApiData('ofertas?page=1&limit=100'),
    });
};
