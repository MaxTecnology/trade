import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
// Solicitações de estorno dos associados da agência (visão agency_admin/operator).
// GET /estornos/filhos só aceita agency_admin/agency_operator — enabled evita
// chamar (e tomar 403) quando quem está logado não é Agência.
export const useQueryEncaminhadasExtorno = (enabled = true) => {
    return useQuery({
        queryKey: ['estornos', 'filhos'],
        queryFn: async () => getApiData('estornos/filhos?page=1&limit=30'),
        enabled,
    });
};
