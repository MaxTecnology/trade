import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '../ListasHook';

// Créditos encaminhados pra Matriz aprovar/negar — GET /creditos/matriz só
// aceita superadmin; enabled evita chamar (e tomar 403) quando quem está
// logado não é Matriz.
export const useQueryCreditosAprovar = (enabled = true) => {
    return useQuery({
        queryKey: ['creditosAprovar'],
        queryFn: async () => getApiDataAllPages('creditos/matriz?page=1&limit=100'),
        enabled,
    });
};
