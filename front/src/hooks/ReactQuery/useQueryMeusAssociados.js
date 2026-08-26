import { useQuery } from '@tanstack/react-query';
import { isGerente } from '../getId';
import { getApiData } from '../ListasHook';
import state from '../../store';

// gerentes/:id/associados espera o Associado.id do próprio gerente
// (gerenteId aponta pra Associado.id); agencias/:id/associados espera o
// Agencia.id da própria agência — os dois são exatamente state.user.entityId
// (id da entidade, vindo do JWT/`/auth/me`), nunca state.user.idUsuario
// (Usuario.id, entidade diferente — usar esse aqui sempre dava 404/vazio).
export const useQueryMeusAssociados = (enabled = true) => {
    const url = isGerente()
        ? `gerentes/${state.user?.entityId}/associados`
        : `agencias/${state.user?.entityId}/associados`
    return useQuery({
        queryKey: ['meusAssociados', state.user?.entityId],
        queryFn: async () => getApiData(`${url}?limit=100`),
        enabled: enabled && !!state.user?.entityId,
    });
};
