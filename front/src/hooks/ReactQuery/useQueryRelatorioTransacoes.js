import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';

// Visão ampla de transações — GET /relatorios/permutas sem filtro de tipo
// mostra todos os tipos (não só permuta). Agência vê a própria conta +
// associados geridos; Matriz vê tudo, sem filtro.
export const useQueryRelatorioTransacoes = () => {
    return useQuery({
        queryKey: ['relatorios', 'permutas'],
        queryFn: async () => getApiData('relatorios/permutas?page=1&limit=100'),
    });
};
