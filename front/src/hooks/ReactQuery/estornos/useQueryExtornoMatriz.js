import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
// Solicitações de estorno encaminhadas para a Matriz aprovar/negar
export const useQueryExtornoMatriz = () => {
    return useQuery({
        queryKey: ['estornos', 'matriz'],
        queryFn: async () => getApiData('estornos/matriz?page=1&limit=30'),
    });
};
