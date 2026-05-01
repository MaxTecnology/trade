import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryVoucher = () => {
    return useQuery({
        queryKey: ['voucher'],
        queryFn: async () => getApiData('vouchers/transacoes-com-voucher?page=1&pageSize=200'),
    });
};
