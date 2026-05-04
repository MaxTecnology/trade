import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryAssociados = () => {
    return useQuery({
        queryKey: ['associados'],
        queryFn: async () => getApiData('associados?page=1&limit=100'),
    });
};
