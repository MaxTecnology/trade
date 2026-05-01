import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
import { getId } from '@/hooks/getId';
export const useQuerySubContas = () => {
    return useQuery({
        queryKey: ['sub-contas'],
        queryFn: async () => getApiData(`contas/listar-subcontas/${getId()}?page=1&pageSize=100`),
    });
};
