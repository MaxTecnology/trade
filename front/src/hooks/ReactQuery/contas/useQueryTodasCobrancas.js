import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
import { isMatriz } from '@/hooks/getId';

// Matriz nunca é devedora (ver useQueryContasPagar.js), então "Contas a
// Pagar" pra ela é a visão consolidada de tudo que os associados/agências
// têm pendente — GET /cobrancas (superadmin-only, todas as cobranças do
// sistema, sem filtro de entidade).
export const useQueryTodasCobrancas = () => {
    return useQuery({
        queryKey: ['cobrancasTodas'],
        queryFn: async () => getApiData('cobrancas?page=1&limit=100'),
        enabled: isMatriz(),
    });
};
