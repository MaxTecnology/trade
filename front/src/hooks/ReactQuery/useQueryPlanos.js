import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryPlanos = () => {
    return useQuery({
        queryKey: ['planos'],
        queryFn: async () => getApiData('planos/listar-planos'),
    });
};
