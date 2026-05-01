import { useQuery } from '@tanstack/react-query';
import { postItem } from '../ListasHook';
export const useQueryAgencias = () => {
    const url = "usuarios/listar-tipo-usuarios"
    const body = {
        "tipoConta": ["Matriz", "Franquia Comum", "Franquia Master", "Franquia Fillial"]
    };
    return useQuery({
        queryKey: ['agencias'],
        queryFn: async () => postItem(url, body),
    });
};
