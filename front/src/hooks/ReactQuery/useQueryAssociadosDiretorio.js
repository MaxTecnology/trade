import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';

export const useQueryAssociadosDiretorio = () => {
    return useQuery({
        queryKey: ['associados', 'diretorio'],
        queryFn: async () => getApiData('associados/diretorio'),
    });
};
