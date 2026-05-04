import { useEffect, useState } from "react";
import PlanosOptions from "../Options/PlanosOptions";
import { useQueryPlanos } from "@/hooks/ReactQuery/useQueryPlanos";

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
                <label className="required">Valor do Plano (RT$)</label>
                <input
                    type="text"
                    className="readOnly"
                    readOnly
                    required
                    value={selected?.taxaInscricaoRT ?? defaultPlano?.taxaInscricaoRT ?? ''}
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
                <label className="required">Taxa de Manutenção Anual (RT$)</label>
                <input
                    type="text"
                    className="readOnly"
                    readOnly
                    required
                    value={selected?.taxaManutencaoAnualRT ?? defaultPlano?.taxaManutencaoAnualRT ?? ''}
                />
            </div>
        }
        <input type="hidden" name="planoId" value={selected?.id ?? defaultValue?.planoId ?? ''} />
    </>
};

export default PlanosFields;
