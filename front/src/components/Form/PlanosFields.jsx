import { useEffect, useState } from "react";
import PlanosOptions from "../Options/PlanosOptions";
import { useQueryPlanos } from "@/hooks/ReactQuery/useQueryPlanos";

const formatMoney = (value) => {
    if (value === null || value === undefined || value === '') return ''
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const PlanosFields = ({ type, defaultValue, optional }) => {
    const { data } = useQueryPlanos()
    const [selected, setSelected] = useState(null);
    const [defaultPlano, setDefaultPlano] = useState(null);

    useEffect(() => {
        if (defaultValue && Array.isArray(data)) {
            const defaultPlan = data.find(p => p.id === defaultValue?.planoId) ?? null
            setDefaultPlano(defaultPlan)
        }
    }, [defaultValue, data])

    return <>
        <div className="form-group">
            <label className="required">Plano de Inscrição</label>
            <select
                id="planoAssociado"
                defaultValue={defaultValue?.planoId ?? ""}
                onChange={(e) => setSelected(JSON.parse(e.target.value))}
                required={!optional}
            >
                <option value="" disabled>Selecione</option>
                <PlanosOptions type={type} complex />
            </select>
        </div>
        {type === "associado" &&
            <div className="form-group">
                <label className="required">Valor do Plano (R$)</label>
                <input
                    type="text"
                    className="readOnly"
                    readOnly
                    required
                    value={formatMoney(selected?.taxaInscricao ?? defaultPlano?.taxaInscricao)}
                />
            </div>
        }
        <div className="form-group">
            <label className={optional ? '' : 'required'}>Percentual de Comissão %</label>
            <input
                type="text"
                className="readOnly"
                readOnly
                required={!optional}
                value={selected?.percentualComissao ?? defaultPlano?.percentualComissao ?? ''}
            />
        </div>
        {type === "associado" &&
            <div className="form-group">
                <label className="required">Taxa de Manutenção Anual (R$)</label>
                <input
                    type="text"
                    className="readOnly"
                    readOnly
                    required
                    value={formatMoney(selected?.taxaManutencaoAnual ?? defaultPlano?.taxaManutencaoAnual)}
                />
            </div>
        }
        <input type="hidden" name="planoId" value={selected?.id ?? defaultValue?.planoId ?? ''} />
    </>
};

export default PlanosFields;
