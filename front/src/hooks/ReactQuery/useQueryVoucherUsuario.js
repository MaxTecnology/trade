import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
import { getId } from '../getId';
export const useQueryVoucherUsuario = () => {
    return useQuery({
        queryKey: ['voucherUsuario'],
        queryFn: async () => getApiData(`vouchers/vouchers-do-usuario/${getId()}?page=1&pageSize=200`),
    });
};
