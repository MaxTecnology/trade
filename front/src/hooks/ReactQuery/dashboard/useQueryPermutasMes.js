import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';
import { currentMonthRange } from '@/utils/functions/tables/date';
import { isAdminEntidade, isMatriz } from '@/hooks/getId';

const somaValorRT = (items) =>
    (items ?? [])
        .filter((t) => (t.tipo === 'permuta' || t.tipo === 'negociada') && t.status === 'concluida')
        .reduce((soma, t) => soma + Number(t.valorRT ?? 0), 0);

// "Unidade" = participação da própria conta logada esse mês (GET /transacoes,
// já escopado por contaId no backend pra qualquer role). "Geral" = visão mais
// ampla (GET /relatorios/permutas — superadmin vê tudo, agency_admin vê a
// agência + associados, associate_admin vê os próprios), só existe pra
// associate_admin/agency_admin/superadmin (mesmo guard da rota); operadores
// não chamam essa segunda query, evita 403.
export const useQueryPermutasMes = () => {
    const { dataInicio } = currentMonthRange();
    // GET /transacoes exige dataInicio em ISO datetime completo (z.string().datetime()
    // no schema) — diferente de GET /relatorios/permutas, que só faz new Date(dataInicio)
    // e aceita a data "solta" (YYYY-MM-DD) sem problema.
    const dataInicioISO = new Date(dataInicio).toISOString();
    const podeVerGeral = isAdminEntidade() || isMatriz();

    const unidade = useQuery({
        queryKey: ['permutasMes', 'unidade', dataInicio],
        queryFn: async () => getApiData(`transacoes?dataInicio=${dataInicioISO}&limit=100`),
    });

    const geral = useQuery({
        queryKey: ['permutasMes', 'geral', dataInicio],
        queryFn: async () => getApiData(`relatorios/permutas?dataInicio=${dataInicio}&limit=100`),
        enabled: podeVerGeral,
    });

    return {
        valorUnidade: somaValorRT(unidade.data?.data),
        valorGeral: podeVerGeral ? somaValorRT(geral.data?.data) : somaValorRT(unidade.data?.data),
    };
};
