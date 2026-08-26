import { useQuery } from "@tanstack/react-query";
import { getApiData, formatDate } from "@/hooks/ListasHook";

const UltimaTransação = () => {
    // GET /transacoes já ordena por criadoEm desc — a primeira da página 1 é a mais recente.
    const { data } = useQuery({
        queryKey: ["ultimaTransacao"],
        queryFn: async () => getApiData("transacoes?page=1&limit=1"),
    });
    const ultima = data?.data?.[0];

    return (
        <div>
            Ultima Transação:
            <span>{ultima ? formatDate(ultima.criadoEm) : "Sem transações"}</span>
        </div>
    );
};

export default UltimaTransação;
