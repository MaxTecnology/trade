import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
// Solicitações de estorno dos associados da agência (visão agency_admin/operator)
export const useQueryEncaminhadasExtorno = () => {
    return useQuery({
        queryKey: ['estornos', 'filhos'],
        queryFn: async () => getApiData('estornos/filhos?page=1&limit=30'),
    });
};
