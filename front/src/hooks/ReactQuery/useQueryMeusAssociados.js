import { useQuery } from '@tanstack/react-query';
import { getId, isGerente } from '../getId';
import { getApiData } from '../ListasHook';
export const useQueryMeusAssociados = () => {
    const url = isGerente()
        ? `gerentes/${getId()}/associados`
        : `agencias/${getId()}/associados`
    return useQuery({
        queryKey: ['meusAssociados'],
        queryFn: async () => getApiData(url),
    });
};
