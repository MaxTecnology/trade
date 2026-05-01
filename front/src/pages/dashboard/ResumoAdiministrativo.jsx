import LimiteCredito from "@/pages/dashboard/resumo/LimiteCredito"
import SaldoPermutas from "@/pages/dashboard/resumo/SaldoPermutas"
import UltimaTransação from "./resumo/UltimaTransação";

const ResumoAdiministrativo = () => {
    return (
        <div className="homeBodyRightItem">
            <h5>Resumo Financeiro</h5>
            <div>
                <LimiteCredito />
                <SaldoPermutas />
                <UltimaTransação />
            </div>
        </div>
    )
};

export default ResumoAdiministrativo;
