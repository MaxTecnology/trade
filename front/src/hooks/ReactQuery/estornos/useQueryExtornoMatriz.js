import { useQuery } from '@tanstack/react-query';
import { postItem } from '@/hooks/ListasHook';
import { getId } from '@/hooks/getId';
export const useQueryExtornoMatriz = () => {
    return useQuery({
        queryKey: ['extornoMatriz'],
        queryFn: async () => postItem(`transacoes/visualizar-estornos-encaminhados-matriz/${getId()}?page=1&pageSize=30`, {}),
    });
};
