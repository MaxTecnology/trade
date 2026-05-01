import { useQuery } from '@tanstack/react-query';
import { postItem } from '../ListasHook';
export const useQueryAssociados = () => {
    const url = "usuarios/listar-tipo-usuarios?page=1&pageSize100"
    const body = {
        "tipoConta": ["Associado"]
    };
    return useQuery({
        queryKey: ['associados'],
        queryFn: async () => postItem(url, body),
    });
};
