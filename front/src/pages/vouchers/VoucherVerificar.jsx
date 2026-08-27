import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Logo from "@/assets/images/Logo2.png";
import api from "@/services/api";
import { formatDate } from "@/hooks/ListasHook";
import { formatarNumeroParaRT } from "@/utils/functions/formartNumber";
import { compradorLabel, vendedorLabel } from "@/utils/functions/tables/compradorVendedor";
import { exportVoucherPdf } from "@/utils/functions/exportVoucherPdf";

const STATUS_LABEL = {
    concluida: 'Concluída',
    pendente: 'Pendente',
    estornada: 'Estornada',
    falha: 'Falha',
};

// Página pública (sem login) — verifica a autenticidade de um voucher pelo
// código, consultando GET /vouchers/verificar/:codigo.
const VoucherVerificar = () => {
    const { codigo } = useParams();
    const [voucher, setVoucher] = useState(null);
    const [erro, setErro] = useState(false);

    useEffect(() => {
        api.get(`vouchers/verificar/${codigo}`)
            .then((res) => setVoucher(res.data.data))
            .catch(() => setErro(true));
    }, [codigo]);

    return (
        <div className="w-full h-full bg-slate-600 display flex items-center text-center justify-center">
            <div className="bg-white border p-10 shadow rounded-md flex flex-col gap-4 min-w-[300px] w-full max-w-[500px]">
                <img src={Logo} alt="" className="w-full h-14" />
                <h3 className="text-center text-lg font-bold">Verificação de Voucher</h3>

                {erro && <p className="text-red-600">Voucher não encontrado. Confira o código informado.</p>}

                {!erro && !voucher && <p>Verificando...</p>}

                {voucher && (
                    <div className="flex flex-col gap-3 text-left">
                        <div>
                            <span className="text-sm text-gray-500 block">Código</span>
                            <p className="font-semibold">{voucher.codigo}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block">Emitido em</span>
                            <p>{formatDate(voucher.emitidoEm)}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block">Vendedor</span>
                            <p>{vendedorLabel(voucher.transacao)}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block">Comprador</span>
                            <p>{compradorLabel(voucher.transacao)}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block">Valor RT$</span>
                            <p>RT$ {formatarNumeroParaRT(voucher.transacao?.valorRT ?? 0)}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 block">Status</span>
                            <p>{STATUS_LABEL[voucher.transacao?.status] ?? voucher.transacao?.status}</p>
                        </div>
                        <div className="buttonContainer">
                            <button className="!w-full !p-5 !text-[14px]" type="button" onClick={() => exportVoucherPdf(voucher)}>
                                Baixar comprovante
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoucherVerificar;
