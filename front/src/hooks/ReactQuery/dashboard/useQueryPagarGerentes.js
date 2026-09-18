import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
// Mesma fonte de dados da tela "Comissões" (seção "A Pagar Gerentes") — soma
// o que ainda está pendente (pago: false), não o histórico desde sempre
// (que era o bug: /relatorios/comissoes-gerentes somava tudo, sem nunca
// descontar o que já tinha sido pago).
export const useQueryPagarGerentes = (enabled = true) => {
    return useQuery({
        queryKey: ['pagamentosGerente'],
        queryFn: async () => getApiData('gerentes/pagamentos?page=1&limit=100'),
        enabled,
    });
};
