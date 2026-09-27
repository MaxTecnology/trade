import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '../ListasHook';

export const useQueryAssociados = (enabled = true) => {
    return useQuery({
        queryKey: ['associados'],
        queryFn: async () => getApiDataAllPages('associados?page=1&limit=100'),
        enabled,
    });
};
