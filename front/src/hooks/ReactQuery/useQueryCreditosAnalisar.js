import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '../ListasHook';

// Créditos dos associados da própria Agência — GET /creditos/filhos só aceita
// agency_admin/operator; enabled evita chamar (e tomar 403) quando quem está
// logado não é Agência.
export const useQueryCreditosAnalisar = (enabled = true) => {
    return useQuery({
        queryKey: ['creditosAnalisar'],
        queryFn: async () => getApiDataAllPages('creditos/filhos?page=1&limit=100'),
        enabled,
    });
};
