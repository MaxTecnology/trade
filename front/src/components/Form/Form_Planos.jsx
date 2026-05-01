import PlanosOptions from "../Options/PlanosOptions";
import { useQueryPlanos } from "@/hooks/ReactQuery/useQueryPlanos";

const Form_Planos = ({ type, form }) => {
    const { data } = useQueryPlanos()

    return <>
        <div className="form-group">
            <label className="required">Plano de Inscrição</label>
            <select id="planoAssociado" defaultValue={defaultValue && defaultValue.conta.planoId ? defaultValue.conta.planoId : ""} onChange={(e) => setSelected(JSON.parse(e.target.value))} required>
                <option value="" disabled>
                    Selecione
                </option>
                <PlanosOptions type={type} complex />
            </select>
        </div>
        {type === "Associado" ?
            <div className="form-group">
                <label className="required">Valor do Plano</label>
                <input
                    type="text"
                    className="readOnly"
                    readOnly
                    required
                    value={selected ? selected?.taxaInscricao
                        : defaultPlano?.taxaInscricao}
                />
            </div>
            :
            <input type="hidden" value={selected?.idPlano} />
        }
        <div className="form-group">
            <label className="required">Percentual de Comissão %</label>
            <input
                type="text" className="readOnly" readOnly required value={selected ? selected?.taxaComissao : defaultPlano?.taxaComissao} />
        </div>
        {type === "Associado" ?
            <div className="form-group">
                <label className="required">Taxa Anual</label>
                <input type="text" className="readOnly" readOnly required value={selected ? selected?.taxaManutencaoAnual : defaultPlano?.taxaManutencaoAnual} />
            </div>
            :
            <input type="hidden" value={selected?.idPlano} />
        }

        <input type="hidden" name="planoId" value={selected ? selected?.idPlano : defaultValue?.conta.planoId} />
    </>
};

export default Form_Planos;
