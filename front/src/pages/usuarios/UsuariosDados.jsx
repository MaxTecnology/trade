import { useEffect } from "react";
import defaultImage from "@/assets/images/default_img.png"
import Footer from "@/components/Footer";
import { activePage } from "@/utils/functions/setActivePage";
import InputMask from 'react-input-mask';
import { useSnapshot } from "valtio";
import state from "@/store";
import { isMatriz, isAgencia, isAssociado } from "@/hooks/getId";
import { useQueryMinhaAgencia } from "@/hooks/ReactQuery/useQueryMinhaAgencia";
import { useQueryMeuAssociado } from "@/hooks/ReactQuery/useQueryMeuAssociado";

const STATUS_LABEL = { ativo: "Ativo", inativo: "Inativo", suspenso: "Suspenso" }
const TIPO_AGENCIA_LABEL = { master: "Master", comum: "Comum" }
const TIPO_OPERACAO_LABEL = { compra: "Compra", venda: "Venda", compra_venda: "Compra/Venda" }

const formatMoney = (value) => {
    if (value === null || value === undefined || value === '') return ''
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const isURL = (str) => {
    try {
        new URL(str);
        return true;
    } catch (_) {
        return false;
    }
};

// Somente leitura — Matriz não tem entidade própria no banco (só a Conta),
// então mostra apenas identidade + conta. Agência/Associado buscam a
// entidade real via /agencias/me ou /associados/me (fixa os campos que
// antes vinham sempre em branco, presos ao snapshot enxuto do /auth/me).
const UsuariosDados = () => {
    const userInfo = useSnapshot(state.user)
    useEffect(() => {
        activePage("usuarios")
    }, []);

    const matriz = isMatriz()
    const agencia = isAgencia()
    const associado = isAssociado()

    const { data: agenciaResp } = useQueryMinhaAgencia(agencia)
    const { data: associadoResp } = useQueryMeuAssociado(associado)

    const entidade = agencia ? agenciaResp?.data : associado ? associadoResp?.data : null
    const contato = entidade?.contatos?.[0]

    const imageUrl = isURL(entidade?.imagemUrl) ? entidade.imagemUrl : defaultImage;

    const tipoOperacaoLabel = TIPO_OPERACAO_LABEL[entidade?.tipoOperacao] ?? ""
    const tipoLabel = associado ? tipoOperacaoLabel : (TIPO_AGENCIA_LABEL[entidade?.tipo] ?? "")

    return (
        <div className="container">
            <div className="containerHeader">Meus Dados</div>
            <div className="containerForm">
                {matriz ? (
                    <>
                        <div className="form-group">
                            <label>Nome Fantasia</label>
                            <input type="text" className="readOnly" defaultValue={userInfo.nomeFantasia} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Limite de Crédito</label>
                            <input type="text" className="readOnly" defaultValue={formatMoney(userInfo.conta?.limiteCredito)} readOnly />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="form-group">
                            <label>Razão Social</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.nome} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Nome Fantasia</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.nomeFantasia} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Descrição</label>
                            <textarea className="readOnly" cols="30" rows="1" defaultValue={entidade?.descricao} readOnly></textarea>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <input type="text" className="readOnly" defaultValue={STATUS_LABEL[entidade?.status] ?? ""} readOnly />
                        </div>
                        <div className="form-group">
                            <label>CNPJ</label>
                            <InputMask mask="99.999.999/9999-99" maskChar={null} value={entidade?.cnpj || ""} readOnly>
                                {(inputProps) => <input {...inputProps} type="text" className="readOnly" />}
                            </InputMask>
                        </div>
                        <div className="form-group">
                            <label>Insc. Estadual</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.inscEstadual} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Insc. Municipal</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.inscMunicipal} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Restrições</label>
                            <textarea className="readOnly" cols="30" rows="1" readOnly defaultValue={
                                associado ? (entidade?.restricao || "Sem restrições") : entidade?.restricao
                            }></textarea>
                        </div>
                        <div className="form-group">
                            <label>Categoria</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.categoria?.nome} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Mostrar no site</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.mostrarNoSite === undefined ? "" : (entidade.mostrarNoSite ? "Sim" : "Não")} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Tipo</label>
                            <input type="text" className="readOnly" defaultValue={tipoLabel} readOnly />
                        </div>
                        <div className="formDivider">
                            <p>Contato</p>
                        </div>
                        <div className="form-group f2">
                            <label>Nome</label>
                            <input type="text" className="readOnly" defaultValue={contato?.nomeContato} readOnly />
                        </div>
                        <div className="form-group f2">
                            <label>Telefone</label>
                            <InputMask mask="(99)9999-9999" maskChar={null} value={entidade?.telefone || ""} readOnly>
                                {(inputProps) => <input {...inputProps} type="text" className="readOnly" />}
                            </InputMask>
                        </div>
                        <div className="form-group f2">
                            <label>Celular</label>
                            <InputMask mask="(99)99999-9999" maskChar={null} value={contato?.celular || ""} readOnly>
                                {(inputProps) => <input {...inputProps} type="text" className="readOnly" />}
                            </InputMask>
                        </div>
                        <div className="form-group f2">
                            <label>E-mail</label>
                            <input type="email" className="readOnly" defaultValue={contato?.emailContato ?? entidade?.email} readOnly />
                        </div>
                        <div className="form-group f2">
                            <label>E-mail secundário</label>
                            <input type="email" className="readOnly" defaultValue={contato?.emailSecundario} readOnly />
                        </div>
                        <div className="form-group f2">
                            <label>Site</label>
                            <input type="text" className="readOnly" defaultValue={contato?.site} readOnly />
                        </div>
                        <div className="formDivider">
                            <p>Endereço</p>
                        </div>
                        <div className="form-group">
                            <label>Logradouro</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.logradouro} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Número</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.numero} readOnly />
                        </div>
                        <div className="form-group">
                            <label>CEP</label>
                            <InputMask mask="99999-999" maskChar={null} value={entidade?.cep || ""} readOnly>
                                {(inputProps) => <input {...inputProps} type="text" className="readOnly" />}
                            </InputMask>
                        </div>
                        <div className="form-group">
                            <label>Complemento</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.complemento} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Bairro</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.bairro} readOnly />
                        </div>
                        <div className="form-group f2">
                            <label>Cidade</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.cidade} readOnly />
                        </div>
                        <div className="form-group f1">
                            <label>Estado</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.estado} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Região</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.regiao} readOnly />
                        </div>
                        <div className="formDivider">
                            <p>Plano</p>
                        </div>
                        <div className="form-group">
                            <label>Plano de Inscrição</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.plano?.nome} readOnly />
                        </div>
                        {associado &&
                            <div className="form-group">
                                <label>Valor do Plano (R$)</label>
                                <input type="text" className="readOnly" defaultValue={formatMoney(entidade?.plano?.taxaInscricao)} readOnly />
                            </div>
                        }
                        <div className="form-group">
                            <label>Percentual de Comissão %</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.plano?.percentualComissao ?? ""} readOnly />
                        </div>
                        {associado &&
                            <div className="form-group">
                                <label>Taxa de Manutenção Anual (R$)</label>
                                <input type="text" className="readOnly" defaultValue={formatMoney(entidade?.plano?.taxaManutencaoAnual)} readOnly />
                            </div>
                        }
                        <div className="form-group">
                            <label>Data Vencimento Fatura</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.diaVencimentoFatura} readOnly />
                        </div>
                        <div className="formDivider">
                            <p>Operações</p>
                        </div>
                        <div className="form-group">
                            <label>Gerente de Conta</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.gerente?.nome || "Indefinido"} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Tipo de Operação</label>
                            <input type="text" className="readOnly" defaultValue={tipoOperacaoLabel} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Limite Crédito</label>
                            <input type="text" className="readOnly" defaultValue={formatMoney(entidade?.limiteCredito)} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Limite de Venda Mensal</label>
                            <input type="text" className="readOnly" defaultValue={formatMoney(entidade?.limiteVendaMensal)} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Limite de Venda Total</label>
                            <input type="text" className="readOnly" defaultValue={formatMoney(entidade?.limiteVendaTotal)} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Aceita Orçamento</label>
                            <input type="text" className="readOnly" defaultValue={entidade?.aceitaOrcamento === undefined ? "" : (entidade.aceitaOrcamento ? "Sim" : "Não")} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Aceita Voucher</label>
                            <input type="text" className="readOnly" defaultValue="" readOnly />
                        </div>
                    </>
                )}
                <div className="formDivider">
                    <p>Dados do usuário</p>
                </div>
                <div className="formImage">
                    <img src={imageUrl} className="rounded float-left img-fluid" alt="..." id="imagem-selecionada" />
                </div>
                <div className="form-group">
                    <label>Nome</label>
                    <input type="text" className="readOnly" defaultValue={userInfo.nome} readOnly />
                </div>
                <div className="form-group">
                    <label>Cpf</label>
                    <InputMask mask="999.999.999-99" maskChar={null} value={userInfo.cpf || ""} readOnly>
                        {(inputProps) => <input {...inputProps} type="text" className="readOnly" />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>E-mail</label>
                    <input type="email" className="readOnly" defaultValue={userInfo.email} readOnly />
                </div>
            </div>
            <Footer />
        </div>)
};

export default UsuariosDados;
