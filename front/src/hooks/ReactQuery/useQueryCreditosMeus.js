import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '../ListasHook';

// Minhas próprias solicitações de crédito (Associado) — GET /creditos/meus.
export const useQueryCreditosMeus = () => {
    return useQuery({
        queryKey: ['creditosMeus'],
        queryFn: async () => getApiDataAllPages('creditos/meus?page=1&limit=100'),
    });
};
