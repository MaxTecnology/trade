import { useQuery } from '@tanstack/react-query';
import { getApiData } from '../ListasHook';
export const useQueryCategorias = () => {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => getApiData('categorias/listar-categorias?page=1&pageSize=30'),
  });
};
