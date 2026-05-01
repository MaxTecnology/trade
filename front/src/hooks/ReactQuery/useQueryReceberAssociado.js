import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
import { getId } from '../getId';
export const useQueryReceberAssociado = () => {
    return useQuery({
        queryKey: ['receberAssociado'],
        queryFn: async () => getApiData(`dashboard/receita-agencia/${getId()}`),
    });
};


