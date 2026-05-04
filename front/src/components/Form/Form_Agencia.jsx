import FormSelect from "./formItens/FormSelect";
import FormInput from "./formItens/FormInput";
import FormPlano from "./formItens/FormPlano";
import FormInputMoney from "./formItens/FormInputMoney";
import { useWatch } from "react-hook-form";

const Form_Agencia = ({ form, type }) => {
    const formaPagamento = useWatch({ control: form.control, name: "formaPagamento" })
    const fp = String(formaPagamento)

    const showBRL = fp === "0" || fp === "50"
    const showRT  = fp === "100" || fp === "50"

    return (<>
        <FormPlano type={type} form={form} />
        <FormSelect required form={form} name="formaPagamento" label="Forma de pagamento do Plano" placeholder="Selecionar" items={[
            { value: 100, label: "Permuta" },
            { value: 0, label: "Dinheiro" },
            { value: 50, label: "Permuta / Dinheiro" },
        ]} />
        {showBRL && (
            <FormInputMoney required name="valorInscricaoBRL" label="Valor em Dinheiro (R$)" form={form} placeholder={"R$ 0,00"} />
        )}
        {showRT && (
            <FormInputMoney required name="valorInscricaoRT" label="Valor em Permuta (RT$)" form={form} placeholder={"RT$ 0,00"} />
        )}
        <FormSelect required form={form} name="dataVencimentoFatura" label="Data Vencimento Fatura" placeholder="Selecionar" items={[
            { value: 10, label: "10" },
            { value: 20, label: "20" },
            { value: 30, label: "30" },
        ]} />
        <FormInput required form={form} name="nomeFranquia" label="Nome da Agência" placeholder="Franquia" divClassName={""} disabled />
    </>)
};

export default Form_Agencia;
