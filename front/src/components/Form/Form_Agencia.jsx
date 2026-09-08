import FormSelect from "./formItens/FormSelect";
import FormInput from "./formItens/FormInput";
import FormPlano from "./formItens/FormPlano";
import FormInputMoney from "./formItens/FormInputMoney";
import { useWatch } from "react-hook-form";
import { useEffect } from "react";

const parseMoneyValue = (val) => {
    if (!val) return 0
    const cleaned = String(val).replace(/[^0-9,]/g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
}

const formatMoney = (valor, currency) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor).replace('R$', currency)

const Form_Agencia = ({ form, type }) => {
    const formaPagamento = useWatch({ control: form.control, name: "formaPagamento" })
    const planoValor = useWatch({ control: form.control, name: "planoValor" })
    const fp = String(formaPagamento)
    const valorPlano = parseMoneyValue(planoValor)

    const showBRL = fp === "0" || fp === "50"
    const showRT  = fp === "100" || fp === "50"

    // Recalcula os dois campos inteiros toda vez que o modo muda (ou o valor
    // do plano muda) — nunca só o campo visível, senão o outro fica com
    // valor "fantasma" de um modo anterior (ex: seleciona Permuta, depois
    // Dinheiro, depois volta pra Permuta/Dinheiro — sem isso, os dois
    // ficariam com o valor cheio do plano em vez de dividir). Dinheiro/
    // Permuta puro (100% de um jeito só) não tem outra divisão válida, então
    // preenche o campo único com o valor total e zera o outro. Misto começa
    // dividido meio a meio — só um ponto de partida sensato, o usuário pode
    // reajustar digitando (ver handleBRLChange/handleRTChange abaixo).
    useEffect(() => {
        if (fp === "0") {
            form.setValue("valorInscricaoBRL", formatMoney(valorPlano, 'R$'))
            form.setValue("valorInscricaoRT", formatMoney(0, 'RT$'))
        } else if (fp === "100") {
            form.setValue("valorInscricaoRT", formatMoney(valorPlano, 'RT$'))
            form.setValue("valorInscricaoBRL", formatMoney(0, 'R$'))
        } else if (fp === "50") {
            const metade = valorPlano / 2
            form.setValue("valorInscricaoBRL", formatMoney(metade, 'R$'))
            form.setValue("valorInscricaoRT", formatMoney(metade, 'RT$'))
        }
    }, [fp, valorPlano])

    // Misto (Permuta/Dinheiro) — preencher um dos dois já calcula o outro
    // como o restante do valor do plano, pra nunca passar nem ficar abaixo
    // do total.
    const handleBRLChange = (valorDinheiro) => {
        if (fp !== "50") return
        const restante = Math.max(0, valorPlano - valorDinheiro)
        form.setValue("valorInscricaoRT", formatMoney(restante, 'RT$'))
    }
    const handleRTChange = (valorPermuta) => {
        if (fp !== "50") return
        const restante = Math.max(0, valorPlano - valorPermuta)
        form.setValue("valorInscricaoBRL", formatMoney(restante, 'R$'))
    }

    return (<>
        <FormPlano type={type} form={form} />
        <FormSelect required form={form} name="formaPagamento" label="Forma de pagamento do Plano" placeholder="Selecionar" items={[
            { value: 100, label: "Permuta" },
            { value: 0, label: "Dinheiro" },
            { value: 50, label: "Permuta / Dinheiro" },
        ]} />
        {showBRL && (
            <FormInputMoney
                required
                name="valorInscricaoBRL"
                label="Valor em Dinheiro (R$)"
                form={form}
                placeholder={"R$ 0,00"}
                currency="R$"
                disabled={fp !== "50"}
                onValueChange={handleBRLChange}
            />
        )}
        {showRT && (
            <FormInputMoney
                required
                name="valorInscricaoRT"
                label="Valor em Permuta (RT$)"
                form={form}
                placeholder={"RT$ 0,00"}
                disabled={fp !== "50"}
                onValueChange={handleRTChange}
            />
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
