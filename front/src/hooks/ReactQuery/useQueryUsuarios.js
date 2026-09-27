import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '../ListasHook';
export const useQueryUsuarios = () => {
    return useQuery({
        queryKey: ['usuarios'],
        queryFn: async () => getApiDataAllPages('usuarios?page=1&limit=100'),
    });
};
