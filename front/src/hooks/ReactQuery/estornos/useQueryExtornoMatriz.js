import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
// Solicitações de estorno encaminhadas para a Matriz aprovar/negar.
// GET /estornos/matriz só aceita superadmin — enabled evita chamar (e tomar
// 403) quando quem está logado não é Matriz.
export const useQueryExtornoMatriz = (enabled = true) => {
    return useQuery({
        queryKey: ['estornos', 'matriz'],
        queryFn: async () => getApiData('estornos/matriz?page=1&limit=30'),
        enabled,
    });
};
