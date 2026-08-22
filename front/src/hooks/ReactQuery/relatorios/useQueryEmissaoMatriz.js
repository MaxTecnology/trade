import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';

export const useQueryEmissaoMatriz = (filtros) => {
    const params = new URLSearchParams();
    if (filtros?.dataInicio) params.set('dataInicio', filtros.dataInicio);
    if (filtros?.dataFim) params.set('dataFim', filtros.dataFim);
    const query = params.toString();

    return useQuery({
        queryKey: ['emissaoMatriz', filtros?.dataInicio ?? null, filtros?.dataFim ?? null],
        queryFn: async () => getApiData(`relatorios/emissao-matriz${query ? `?${query}` : ''}`),
    });
};
