import { useQuery } from '@tanstack/react-query';
import { getId, getType } from '../getId';
import { getApiData } from '../ListasHook';
export const useQueryMeusAssociados = () => {
    const tipo = getType()
    const url = tipo === 'Gerente'
        ? `gerentes/${getId()}/associados`
        : `agencias/${getId()}/associados`
    return useQuery({
        queryKey: ['meusAssociados'],
        queryFn: async () => getApiData(url),
    });
};
