import { useEffect } from "react";
import { useQueryPlanos } from "@/hooks/ReactQuery/useQueryPlanos";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import { useWatch } from "react-hook-form";
import PlanosOptions from "@/components/Options/PlanosOptions";

const formatMoney = (value) => {
    if (value === null || value === undefined || value === '') return ''
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const FormPlano = ({ type, form }) => {
    const { data } = useQueryPlanos()
    const planoId = useWatch({ control: form.control, name: "planoId" });

    useEffect(() => {
        if (planoId && Array.isArray(data)) {
            const plano = data.find(p => p.id === planoId) ?? null
            form.setValue("planoValor", formatMoney(plano?.taxaInscricao))
            form.setValue("comissao", plano?.percentualComissao ?? '')
            form.setValue("planoTaxa", formatMoney(plano?.taxaManutencaoAnual))
        }
    }, [planoId, data])

    return <>
        <FormSelect required form={form} name="planoId" label="Plano de Inscrição" placeholder="Selecionar" options={<PlanosOptions type={type} />} />
        {type?.toLowerCase() === "associado" &&
            <FormInput required form={form} name="planoValor" label="Valor do Plano (R$)" disabled />
        }
        <FormInput required form={form} name="comissao" label="Percentual de Comissão %" disabled />
        {type?.toLowerCase() === "associado" &&
            <FormInput required form={form} name="planoTaxa" label="Taxa de Manutenção Anual (R$)" disabled />
        }
    </>
};

export default FormPlano;
