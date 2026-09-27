import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '@/hooks/ListasHook';

// GET /agencias só aceita superadmin — enabled evita chamar (e ficar
// tentando de novo a cada retry automático do react-query, gerando 403 em
// loop) quando quem está logado não é Matriz.
export const useQueryAgencias = (enabled = true) => {
    return useQuery({
        queryKey: ['agencias'],
        queryFn: async () => {
            const envelope = await getApiDataAllPages('agencias?page=1&limit=100');
            return envelope.data;
        },
        enabled,
    });
};
