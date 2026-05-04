import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
export const useQueryCategorias = () => {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const res = await api.get('categorias');
      return res.data.data;
    },
  });
};
