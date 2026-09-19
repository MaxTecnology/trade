import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';

// Soma em tempo real da comissão da plataforma já gerada no mês corrente
// pela própria conta, ainda NÃO faturada (decisão de produto 2026-09-19) —
// cresce a cada transação nova, alimenta "Próxima fatura" no dashboard.
// Matriz nunca paga comissão de plataforma pra si mesma.
export const useQueryComissaoAcumulada = (enabled = true) => {
    return useQuery({
        queryKey: ['comissaoAcumulada'],
        queryFn: async () => getApiData('cobrancas/minha-comissao-acumulada'),
        enabled,
    });
};
