import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '../ListasHook';
// TODO: API precisa de GET /vouchers?usuarioId= para filtrar por usuário
export const useQueryVoucherUsuario = () => {
    return useQuery({
        queryKey: ['voucherUsuario'],
        queryFn: async () => getApiDataAllPages('transacoes?page=1&limit=100'),
    });
};
