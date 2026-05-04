import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export const useQueryGerentes = () => {
    return useQuery({
        queryKey: ['gerentes'],
        queryFn: async () => {
            const res = await api.get('gerentes');
            return res.data.data;
        },
    });
};
