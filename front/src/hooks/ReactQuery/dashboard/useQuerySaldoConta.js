import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';

// state.user.conta é um snapshot tirado uma vez no login (/auth/me) — nunca
// atualiza depois, mesmo quando o saldo muda (crédito aprovado, permuta,
// negociação...). GET /extrato/saldo é sempre fresco, refeito toda vez que
// o componente monta/a janela ganha foco (comportamento padrão do React Query).
export const useQuerySaldoConta = () => {
    return useQuery({
        queryKey: ['saldoConta'],
        queryFn: async () => getApiData('extrato/saldo'),
    });
};
