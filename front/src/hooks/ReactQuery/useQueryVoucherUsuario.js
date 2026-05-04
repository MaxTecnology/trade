import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
// TODO: API precisa de GET /vouchers?usuarioId= para filtrar por usuário
export const useQueryVoucherUsuario = () => {
    return useQuery({
        queryKey: ['voucherUsuario'],
        queryFn: async () => getApiData('transacoes?page=1&limit=200'),
    });
};
