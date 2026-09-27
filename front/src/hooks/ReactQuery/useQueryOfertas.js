import { useQuery } from '@tanstack/react-query';
import { getApiDataAllPages } from '../ListasHook';
export const useQueryOfertas = () => {
    return useQuery({
        queryKey: ['ofertas'],
        queryFn: async () => getApiDataAllPages('ofertas?page=1&limit=100'),
    });
};

export const useQueryMinhaLoja = () => {
    return useQuery({
        queryKey: ['ofertas', 'minha-loja'],
        queryFn: async () => getApiDataAllPages('ofertas/minha-loja?page=1&limit=100'),
    });
};
