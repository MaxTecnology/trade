import { useEffect } from "react";
import Footer from "../../components/Footer";
import { activePage } from "../../utils/functions/setActivePage";
import ManutencaoAnualTable from "@/components/Tables/ManutencaoAnualTable";
import { columns } from "./constantsManutencaoAnual";
import { useQueryManutencaoAnual } from "@/hooks/ReactQuery/relatorios/useQueryManutencaoAnual";

const ManutencaoAnual = () => {
    const { data } = useQueryManutencaoAnual();

    useEffect(() => {
        activePage("contas");
    }, []);

    return (
        <div className="container">
            <div className="containerHeader">Manutenção Anual</div>
            <div className="containerList">
                <ManutencaoAnualTable columns={columns} data={data?.data?.items ?? []} />
            </div>
            <Footer />
        </div>
    );
};

export default ManutencaoAnual;
