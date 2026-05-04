import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
export const useQueryPlanos = () => {
    return useQuery({
        queryKey: ['planos'],
        queryFn: async () => {
            const res = await api.get('planos');
            return res.data.data; // array de planos
        },
    });
};
