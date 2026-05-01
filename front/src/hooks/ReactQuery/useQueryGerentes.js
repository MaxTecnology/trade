import { useQuery } from '@tanstack/react-query';
import { postItem } from '../ListasHook';
export const useQueryGerentes = () => {
    const url = "usuarios/listar-tipo-usuarios";
    const body = {
        "tipoConta": ["Gerente"]
    };
    return useQuery({
        queryKey: ['gerentes'],
        queryFn: async () => postItem(url, body),
    });
};
