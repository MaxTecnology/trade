import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// incluirInativas: true nas telas admin de gestão de categoria (precisa ver e
// poder reativar as desativadas) — false (default) em qualquer seleção de
// categoria pra oferta, onde inativa nunca deveria aparecer.
export const useQueryCategorias = (incluirInativas = false) => {
  return useQuery({
    queryKey: ['categorias', incluirInativas],
    queryFn: async () => {
      const res = await api.get('categorias', { params: incluirInativas ? { incluirInativas: true } : {} });
      return res.data.data;
    },
  });
};
