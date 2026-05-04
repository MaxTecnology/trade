import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryUsuarios = () => {
    return useQuery({
        queryKey: ['usuarios'],
        queryFn: async () => getApiData('usuarios?page=1&limit=100'),
    });
};
