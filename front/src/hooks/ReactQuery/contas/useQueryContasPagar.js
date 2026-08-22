import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
import { isMatriz } from '@/hooks/getId';

// Matriz nunca é devedora de uma Cobranca (nenhum fluxo do sistema cria uma
// cobrança contra a própria conta dela) — pula a chamada e mantém "Contas a
// Pagar" vazia pra ela, em vez de bater num endpoint que não faz sentido.
export const useQueryContasPagar = () => {
    return useQuery({
        queryKey: ['cobrancasPagar'],
        queryFn: async () => getApiData('cobrancas/minhas?direcao=pagar&page=1&limit=100'),
        enabled: !isMatriz(),
    });
};
