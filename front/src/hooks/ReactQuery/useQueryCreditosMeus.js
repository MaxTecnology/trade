import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';

// Minhas próprias solicitações de crédito (Associado) — GET /creditos/meus.
export const useQueryCreditosMeus = () => {
    return useQuery({
        queryKey: ['creditosMeus'],
        queryFn: async () => getApiData('creditos/meus?page=1&limit=100'),
    });
};
