import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryOfertas = () => {
    return useQuery({
        queryKey: ['ofertas'],
        queryFn: async () => getApiData('ofertas?page=1&limit=100'),
    });
};

export const useQueryMinhaLoja = () => {
    return useQuery({
        queryKey: ['ofertas', 'minha-loja'],
        queryFn: async () => getApiData('ofertas/minha-loja?page=1&limit=100'),
    });
};
