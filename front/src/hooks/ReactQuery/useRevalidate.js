import { useQueryClient } from '@tanstack/react-query';

const useRevalidate = () => {
    const queryClient = useQueryClient();
    const revalidateQuery = (queryName) => {
        queryClient.invalidateQueries(queryName);
    };
    return revalidateQuery;
};

export default useRevalidate;