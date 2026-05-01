import { useEffect } from "react";
import { useQueryPlanos } from "@/hooks/ReactQuery/useQueryPlanos";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import { useWatch } from "react-hook-form";
import PlanosOptions from "@/components/Options/PlanosOptions";

const FormPlano = ({ type, form }) => {
    const { data } = useQueryPlanos()
    const planoId = useWatch({ control: form.control, name: "planoId" });

    useEffect(() => {
        console.log(planoId)
        console.log(data)
        if (planoId) {
            const plano = data ? data.planos.find(p => p.idPlano == planoId) : null
            console.log(plano)
            form.setValue("planoValor", plano?.taxaInscricao)
            form.setValue("comissao", plano?.taxaComissao)
            form.setValue("planoTaxa", plano?.taxaManutencaoAnual)
        }
    }, [planoId])

    return <>
        <FormSelect required form={form} name="planoId" label="Plano de Inscrição" placeholder="Selecionar" options={<PlanosOptions type={type} />} />
        {type === "Associado" ?
            <FormInput required form={form} name="planoValor" label="Valor do Plano" disabled />
            :
            null
        }
        <FormInput required form={form} name="comissao" label="Percentual de Comissão %" disabled />
        {type === "Associado" ?
            <FormInput required form={form} name="planoTaxa" label="Taxa Anual" disabled />
            :
            null
        }
    </>
};

export default FormPlano;
