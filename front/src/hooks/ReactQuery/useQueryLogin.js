import { useQuery } from '@tanstack/react-query';
import { getUserInfo } from '@/auth/authFunction';
export const useQueryLogin = () => {
    return useQuery({
        queryKey: ['login'],
        queryFn: async () => getUserInfo(),
    });
};
