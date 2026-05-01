import { useQuery } from '@tanstack/react-query';
import { getId, getType } from '@/hooks/getId';
import { getApiData } from '@/hooks/ListasHook';

export const useQueryContasReceber = () => {
    const url = getType() === "Matriz" ? `cobrancas/listar-cobrancas/${getId()}` : `dashboard/receita-agencia/${getId()}`
    return useQuery({
        queryKey: ['contasReceber'],
        queryFn: async () => getApiData(url),
    });
};
