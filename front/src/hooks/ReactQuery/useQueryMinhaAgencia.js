import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';

// Dados completos da própria Agência logada (somente leitura) — GET /agencias/me,
// entidade resolvida no backend a partir do JWT. enabled evita chamar (e tomar
// 403) quando quem está logado não é Agência.
export const useQueryMinhaAgencia = (enabled = true) => {
    return useQuery({
        queryKey: ['agencias', 'me'],
        queryFn: async () => getApiData('agencias/me'),
        enabled,
    });
};
