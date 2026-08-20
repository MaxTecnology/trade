import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';

// Todas as solicitações de crédito (superadmin) — GET /creditos.
export const useQueryCreditosTodos = () => {
    return useQuery({
        queryKey: ['creditosTodos'],
        queryFn: async () => getApiData('creditos?page=1&limit=100'),
    });
};
