import { useQuery } from '@tanstack/react-query';
import { postItem } from '@/hooks/ListasHook';
import { getId } from '@/hooks/getId';
export const useQueryEncaminhadasExtorno = () => {
    return useQuery({
        queryKey: ['encaminhadasExtorno'],
        queryFn: async () => postItem(`transacoes/listar-encaminhadas-estorno/${getId()}?page=1&pageSize=30`, {}),
    });
};
