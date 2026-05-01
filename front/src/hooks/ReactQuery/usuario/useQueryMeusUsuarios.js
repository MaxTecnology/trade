import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
import { getId } from '@/hooks/getId';
export const useQueryMeusUsuarios = () => {
    return useQuery({
        queryKey: ['myUsers'],
        queryFn: async () => getApiData(`usuarios/usuarios-criados/${getId()}`),
    });
};
