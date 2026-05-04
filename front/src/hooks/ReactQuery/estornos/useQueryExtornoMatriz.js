import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
// TODO: API precisa de filtro de estorno encaminhado para matriz
export const useQueryExtornoMatriz = () => {
    return useQuery({
        queryKey: ['extornoMatriz'],
        queryFn: async () => getApiData('transacoes?page=1&limit=30'),
    });
};
