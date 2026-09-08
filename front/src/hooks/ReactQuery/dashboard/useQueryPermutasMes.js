import { useQuery } from '@tanstack/react-query';
import { getApiData } from '@/hooks/ListasHook';

// GET /relatorios/permutas-mes já calcula Unidade (eu + meu grupo
// hierárquico — mesma regra dos cards Associados/Ofertas/Fundo Permuta) e
// Geral (total do sistema, sem restrição) no backend — evita duplicar essa
// lógica de agrupamento no front (era exatamente esse o bug: "Unidade"
// calculada aqui só olhava a própria conta, perdendo transações de
// associados diretos/da mesma agência).
export const useQueryPermutasMes = () => {
    const { data } = useQuery({
        queryKey: ['permutasMes'],
        queryFn: async () => getApiData('relatorios/permutas-mes'),
    });

    return {
        valorUnidade: data?.data?.unidade ?? 0,
        valorGeral: data?.data?.geral ?? 0,
    };
};
