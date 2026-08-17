import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';

// Dados completos do próprio Associado logado (somente leitura) — GET /associados/me,
// entidade resolvida no backend a partir do JWT. enabled evita chamar (e tomar
// 403) quando quem está logado não é Associado.
export const useQueryMeuAssociado = (enabled = true) => {
    return useQuery({
        queryKey: ['associados', 'me'],
        queryFn: async () => getApiData('associados/me'),
        enabled,
    });
};
