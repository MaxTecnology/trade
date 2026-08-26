import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryReceberAgencia = (enabled = true) => {
    return useQuery({
        queryKey: ['receberAgencia'],
        queryFn: async () => getApiData('cobrancas/minhas?page=1&limit=100'),
        enabled,
    });
};
