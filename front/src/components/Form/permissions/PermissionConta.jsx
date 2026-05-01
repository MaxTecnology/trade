import FormCheckBox from "../FormCheckBox";


const PermissionConta = ({ form }) => {
    return (
        <div className="pl-4 grid gap-2 pt-1">
            <ul className="pl-6 flex gap-10">
                {/* MINHA CONTA  */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Minha Conta"} form={form} name={"minhaConta.field"} father={"conta"} />
                    <ul className="grid gap-2 pl-7">
                        <FormCheckBox label={"Leitura"} form={form} name={"minhaConta.leitura"} father={"minhaConta.field"} />
                        <FormCheckBox label={"Escrita"} form={form} name={"minhaConta.escrita"} father={"minhaConta.field"} />
                    </ul>
                </li>
                {/* USUÁRIOS */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Meus usuários"} form={form} name={"meusUsuarios.field"} father={"conta"} />
                    <ul className="grid gap-2 pl-7">
                        <FormCheckBox label={"Leitura"} form={form} name={"meusUsuarios.leitura"} father={"meusUsuarios.field"} />
                        <FormCheckBox label={"Escrita"} form={form} name={"meusUsuarios.escrita"} father={"meusUsuarios.field"} />
                        <FormCheckBox label={"Excluir"} form={form} name={"meusUsuarios.excluir"} father={"meusUsuarios.field"} />
                    </ul>
                </li>
                {/* PERMISSÕES */}
                <li className="grid gap-2">
                    <FormCheckBox label={"Permissões de conta"} form={form} name={"permissoesConta.field"} father={"conta"} />
                    <ul className="grid gap-2 pl-7">
                        <FormCheckBox label={"Leitura"} form={form} name={"permissoesConta.leitura"} father={"permissoesConta.field"} />
                        <FormCheckBox label={"Escrita"} form={form} name={"permissoesConta.escrita"} father={"permissoesConta.field"} />
                        <FormCheckBox label={"Excluir"} form={form} name={"permissoesConta.excluir"} father={"permissoesConta.field"} />
                    </ul>
                </li>
            </ul>
        </div>
    )
};

export default PermissionConta;
