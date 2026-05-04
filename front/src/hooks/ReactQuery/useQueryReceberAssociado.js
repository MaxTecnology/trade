import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryReceberAssociado = () => {
    return useQuery({
        queryKey: ['receberAssociado'],
        queryFn: async () => getApiData('cobrancas/minhas?page=1&limit=100'),
    });
};
