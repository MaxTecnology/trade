import { useQuery } from '@tanstack/react-query';
import { getId } from '../getId';
import { getApiData } from '../ListasHook';
export const useQueryMeusAssociados = () => {
    return useQuery({
        queryKey: ['meusAssociados'],
        queryFn: async () => getApiData(`usuarios/usuarios-criados/${getId()}`),
    });
};
