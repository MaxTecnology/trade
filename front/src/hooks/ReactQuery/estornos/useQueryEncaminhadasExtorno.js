import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
// TODO: API precisa de filtro de estorno por status
export const useQueryEncaminhadasExtorno = () => {
    return useQuery({
        queryKey: ['encaminhadasExtorno'],
        queryFn: async () => getApiData('transacoes?page=1&limit=30'),
    });
};
