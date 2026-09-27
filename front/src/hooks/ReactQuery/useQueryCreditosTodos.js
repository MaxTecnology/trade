import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '../ListasHook';

// Todas as solicitações de crédito (superadmin) — GET /creditos.
export const useQueryCreditosTodos = () => {
    return useQuery({
        queryKey: ['creditosTodos'],
        queryFn: async () => getApiDataAllPages('creditos?page=1&limit=100'),
    });
};
