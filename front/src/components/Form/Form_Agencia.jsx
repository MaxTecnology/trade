import FormSelect from "./formItens/FormSelect";
import FormInput from "./formItens/FormInput";
import FormPlano from "./formItens/FormPlano";

const Form_Agencia = ({ form, type }) => {
    return (<>
        <FormPlano type={type} form={form} />
        <FormSelect required form={form} name="formaPagamento" label="Forma de pagamento do Plano" placeholder="Selecionar" items={[
            { value: 100, label: "Permuta" },
            { value: 0, label: "Dinheiro" },
            { value: 50, label: "Permuta / Dinheiro" },
        ]} />
        <FormSelect required form={form} name="dataVencimentoFatura" label="Data Vencimento Fatura" placeholder="Selecionar" items={[
            { value: 10, label: "10" },
            { value: 20, label: "20" },
            { value: 30, label: "30" },
        ]} />
        <FormInput required form={form} name="nomeFranquia" label="Nome da Agência" placeholder="Franquia" divClassName={""} disabled />
    </>)
};

export default Form_Agencia;
