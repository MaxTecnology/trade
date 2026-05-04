import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
// TODO: API precisa de GET /vouchers para listar todos os vouchers com transação
export const useQueryVoucher = () => {
    return useQuery({
        queryKey: ['voucher'],
        queryFn: async () => getApiData('transacoes?page=1&limit=200'),
    });
};
