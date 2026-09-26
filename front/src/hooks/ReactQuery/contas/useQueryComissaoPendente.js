import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';

// Prévia da comissão da plataforma do mês corrente, ainda não consolidada
// numa Cobranca (decisão de produto 2026-09-25) — mesma soma que o job
// mensal vai fechar, só que em tempo real.
export const useQueryComissaoPendente = (enabled = true) => {
    return useQuery({
        queryKey: ['comissaoPendente'],
        queryFn: async () => getApiData('cobrancas/comissao-pendente'),
        enabled,
    });
};
