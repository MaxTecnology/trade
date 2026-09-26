import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';

// Prévia do pagamento de gerente do mês corrente, ainda não consolidado num
// PagamentoGerente (decisão de produto 2026-09-25).
export const useQueryPagamentosGerentePendente = (enabled = true) => {
    return useQuery({
        queryKey: ['pagamentosGerentePendente'],
        queryFn: async () => getApiData('gerentes/pagamentos-pendentes'),
        enabled,
    });
};
