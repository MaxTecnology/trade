import FormCheckBox from "../FormCheckBox";

const PermissionFinanceiro = ({ form }) => {
    return (
        <div className="pl-4 grid gap-2 pt-1">
            <ul className="pl-6 flex gap-10 flex-wrap">
                {/* VENDAS */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Vendas"} form={form} name={"vendas.field"} father={"financeiro"} />
                    <ul className="grid gap-2 pl-7">
                        <FormCheckBox label={"Leitura"} form={form} name={"vendas.leitura"} father={"vendas.field"} />
                        <FormCheckBox label={"Escrita"} form={form} name={"vendas.escrita"} father={"vendas.field"} />
                        <FormCheckBox label={"Cancelamento"} form={form} name={"vendas.cancelamento"} father={"vendas.field"} />
                    </ul>
                </li>
                {/* COMPRAS */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Compras"} form={form} name={"compras.field"} father={"financeiro"} />
                    <ul className="grid gap-2 pl-7">
                        <FormCheckBox label={"Leitura"} form={form} name={"compras.leitura"} father={"compras.field"} />
                        <FormCheckBox label={"Cancelamento"} form={form} name={"compras.cancelamento"} father={"compras.field"} />
                    </ul>
                </li>
                {/* VOUCHERS */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Vouchers"} form={form} name={"vouchers.field"} father={"financeiro"} />
                    <ul className="grid gap-2 pl-7">
                        <FormCheckBox label={"Leitura"} form={form} name={"vouchers.leitura"} father={"vouchers.field"} />
                        <FormCheckBox label={"Solicitação"} form={form} name={"vouchers.solicitar"} father={"vouchers.field"} />
                        <FormCheckBox label={"Aprovação"} form={form} name={"vouchers.aprovar"} father={"vouchers.field"} />
                        <FormCheckBox label={"Recusar"} form={form} name={"vouchers.recusar"} father={"vouchers.field"} />
                    </ul>
                </li>
                {/* OFERTAS */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Ofertas"} form={form} name={"ofertas.field"} father={"financeiro"} />
                    <ul className="grid gap-2 pl-7">
                        <FormCheckBox label={"Leitura"} form={form} name={"ofertas.leitura"} father={"ofertas.field"} />
                        <FormCheckBox label={"Escrita"} form={form} name={"ofertas.escrita"} father={"ofertas.field"} />
                        <FormCheckBox label={"Excluir"} form={form} name={"ofertas.excluir"} father={"ofertas.field"} />
                    </ul>
                </li>
                {/* EXTRATO */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Extratos"} form={form} name={"extratos.field"} father={"financeiro"} />
                    <ul className="grid gap-2 pl-7">
                        <FormCheckBox label={"Leitura"} form={form} name={"extratos.leitura"} father={"extratos.field"} />
                        <FormCheckBox label={"Extorno"} form={form} name={"extratos.extorno"} father={"extratos.field"} />
                    </ul>
                </li>
                {/* FATURAS */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Faturas"} form={form} name={"faturas.field"} father={"financeiro"} />
                    <ul className="grid gap-2 pl-7">
                        <FormCheckBox label={"Leitura"} form={form} name={"faturas.leitura"} father={"faturas.field"} />
                    </ul>
                </li>
                {/* COMISSÕES */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Comissões"} form={form} name={"comissões.field"} father={"financeiro"} />
                    <ul className="grid gap-2 pl-7">
                        <FormCheckBox label={"Leitura"} form={form} name={"comissões.leitura"} father={"comissões.field"} />
                    </ul>
                </li>

            </ul>
        </div>
    )
};

export default PermissionFinanceiro;
