import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '../ListasHook';

export const useQueryContasReceberMatriz = (enabled = true) => {
    return useQuery({
        queryKey: ['receberMatriz'],
        queryFn: async () => getApiDataAllPages('cobrancas?page=1&limit=100'),
        enabled,
    });
};
