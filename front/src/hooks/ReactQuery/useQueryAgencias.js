import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export const useQueryAgencias = () => {
    return useQuery({
        queryKey: ['agencias'],
        queryFn: async () => {
            const res = await api.get('agencias?page=1&limit=100');
            return res.data;
        },
    });
};
