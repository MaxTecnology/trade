import FormCheckBox from "../FormCheckBox";

const PermissionsOperacional = ({ form }) => {
    return (
        <div className="pl-4 grid gap-2 pt-1">
            <ul className="pl-6 flex gap-10">
                {/* ATENDIMENTO */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Atendimentos"} form={form} name={"atendimento.field"} father={"operacional"} />
                    <ul className="grid gap-2 pl-8">
                        <FormCheckBox label={"Leitura"} form={form} name={"atendimento.leitura"} father={"atendimento.field"} />
                        <FormCheckBox label={"Escrita"} form={form} name={"atendimento.escrita"} father={"atendimento.field"} />
                        <FormCheckBox label={"Excluir"} form={form} name={"atendimento.excluir"} father={"atendimento.field"} />
                    </ul>
                </li>
                {/* NEGOCIAÇÕES */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Negociações"} form={form} name={"negociacao.field"} father={"operacional"} />
                    <ul className="grid gap-2 pl-8">
                        <FormCheckBox label={"Leitura"} form={form} name={"negociacao.leitura"} father={"negociacao.field"} />
                        <FormCheckBox label={"Escrita"} form={form} name={"negociacao.escrita"} father={"negociacao.field"} />
                        <FormCheckBox label={"Excluir"} form={form} name={"negociacao.excluir"} father={"negociacao.field"} />
                    </ul>
                </li>
            </ul>
        </div>
    )
};

export default PermissionsOperacional;
