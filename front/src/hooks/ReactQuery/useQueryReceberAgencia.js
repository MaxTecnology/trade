import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
import { getId } from '../getId';
export const useQueryReceberAgencia = () => {
    return useQuery({
        queryKey: ['receberAgencia'],
        queryFn: async () => getApiData(`dashboard/receita-matriz/${getId()}`),
    });
};


