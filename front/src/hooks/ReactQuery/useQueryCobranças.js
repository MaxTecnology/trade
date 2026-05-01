

import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
import { getId } from '../getId';
export const useQueryCobranças = () => {
    return useQuery({
        queryKey: ['cobranças'],
        queryFn: async () => getApiData(`cobrancas/listar-cobrancas/${getId()}`),
    });
};
