import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';

export const useQueryAssociadosDiretorio = (enabled = true) => {
    return useQuery({
        queryKey: ['associados', 'diretorio'],
        queryFn: async () => getApiData('associados/diretorio'),
        enabled,
    });
};
