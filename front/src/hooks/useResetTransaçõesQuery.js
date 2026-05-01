import useRevalidate from "./ReactQuery/useRevalidate";

const useResetTransaçõesQuery = () => {
    const revalidate = useRevalidate();

    const resetQuery = () => {
        console.log("RESET")
        revalidate("transacoes");
        revalidate("login");
        revalidate("encaminhadasExtorno");
        revalidate("extornoMatriz");
    };

    return resetQuery
};

export default useResetTransaçõesQuery;