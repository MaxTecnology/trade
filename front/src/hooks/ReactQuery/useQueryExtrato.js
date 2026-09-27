import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '../ListasHook';

// Ledger da própria conta (movimentacao_conta) — GET /extrato, contaId
// resolvido no backend a partir do JWT.
export const useQueryExtrato = () => {
    return useQuery({
        queryKey: ['extrato'],
        queryFn: async () => getApiDataAllPages('extrato?page=1&limit=100'),
    });
};
