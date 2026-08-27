import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';

// Visão consolidada (Agência vê os próprios + dos seus associados, Matriz vê
// tudo) via GET /vouchers — diferente de useQueryVoucher.js, que lista as
// transações da própria conta do requisitante (Meus Vouchers).
export const useQueryVouchersConsolidado = () => {
    return useQuery({
        queryKey: ['vouchersConsolidado'],
        queryFn: async () => getApiData('vouchers?page=1&limit=100'),
    });
};
