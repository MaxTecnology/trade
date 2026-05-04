import { useState } from 'react';
import Modal from 'react-modal';
import { closeModal } from '@/hooks/Functions';
import { GrFormClose } from "react-icons/gr";
import { BiSolidImageAdd } from 'react-icons/bi';
import RealInput from '@/components/Inputs/CampoMoeda';
import PlanosFields from '@/components/Form/PlanosFields';
import { toast } from 'sonner';
import useRevalidate from '@/hooks/ReactQuery/useRevalidate';
import { imageReferenceHandler } from '@/utils/functions/formHandler';
import InputMask from 'react-input-mask';
import ButtonMotion from '@/components/FramerMotion/ButtonMotion';
import api from '@/services/api';

const parseMoney = (val) => {
    if (!val) return undefined
    const str = String(val)
    // Brazilian format "1.234,56": dots = thousands sep, comma = decimal
    // Plain format "1234.56": dot = decimal
    const cleaned = str.includes(',')
        ? str.replace(/[^0-9,]/g, '').replace(',', '.')
        : str.replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? undefined : num
}

const EditarAgenciaModal = ({ isOpen, modalToggle, associadoInfo }) => {
    const [imagemReference, setImageReference] = useState(null);
    const [reference, setReference] = useState(true)
    const [error, setError] = useState(false)
    const [sucess, setSucess] = useState(false)
    const info = associadoInfo
    const contato = info?.contatos?.[0] ?? {}

    const revalidate = useRevalidate()

    const formHandler = async (event) => {
        event.preventDefault()

        // Capture form values synchronously BEFORE any state change or async operation,
        // so RealInputs still show the formatted string (e.g. "1.234,56") rather than
        // the raw decimal that appears after setReference(false) triggers a re-render.
        const fd = new FormData(event.target)
        const get = (key) => fd.get(key) || undefined
        const imagemFile = event.target.querySelector('input[name="imagem"]')?.files?.[0]

        setReference(false)

        let imagemUrl
        if (imagemFile) {
            try {
                const uploadFd = new FormData()
                uploadFd.append('file', imagemFile)
                const res = await api.post('upload', uploadFd)
                imagemUrl = res.data?.data?.url ?? res.data?.url
            } catch (err) {
                setReference(true)
                toast.error(`Erro ao enviar imagem: ${err?.response?.data?.message ?? err.message}`)
                return
            }
        }

        const payload = {
            nome: get('razaoSocial'),
            nomeFantasia: get('nomeFantasia'),
            email: get('emailContato'),
            telefone: get('telefone'),
            planoId: get('planoId'),
            ...(imagemUrl ? { imagemUrl } : {}),

            nomeContato: get('nomeContato'),
            celular: get('celular'),
            emailSecundario: get('emailSecundario'),

            endereco: {
                logradouro: get('logradouro'),
                numero: get('numero'),
                complemento: get('complemento'),
                bairro: get('bairro'),
                cidade: get('cidade'),
                estado: (get('estado') || '').slice(0, 2),
                cep: get('cep'),
                regiao: get('regiao'),
            },

            limiteCredito: parseMoney(get('limiteCredito')),
            limiteVendaMensal: parseMoney(get('limiteVendaMensal')),
            limiteVendaTotal: parseMoney(get('limiteVendaTotal')),
            taxaRepasseMatriz: get('taxaRepasseMatriz') ? parseFloat(get('taxaRepasseMatriz')) : undefined,
            diaVencimentoFatura: get('dataVencimentoFatura') ? parseInt(get('dataVencimentoFatura')) : undefined,
        }

        // Remove endereco se todos os campos estiverem ausentes
        const end = payload.endereco
        if (!end.logradouro && !end.cidade && !end.estado) {
            delete payload.endereco
        }

        toast.promise(
            api.put(`agencias/${info.id}`, payload).catch(err => {
                throw new Error(err?.response?.data?.message ?? 'Erro ao editar')
            }),
            {
                loading: 'Editando Agência...',
                success: () => {
                    setReference(true)
                    modalToggle()
                    revalidate('agencias')
                    return 'Agência editada com sucesso!'
                },
                error: (err) => {
                    setReference(true)
                    return <b>{err.message}</b>
                },
            }
        )
    }

    if (!info) return null

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => closeModal(modalToggle, setSucess, setError)}
            contentLabel="Editar Agência"
            className="modalContainer modalAnimationUser"
            overlayClassName="modalOverlay modalAnimationUserOverlay"
        >
            <div className='modalEditHeader'>
                <p>Editar Agência</p>
                <GrFormClose onClick={() => closeModal(modalToggle, setSucess, setError)} />
            </div>
            <div className='modalDivider'></div>
            <form onSubmit={formHandler} className="containerForm">
                <div className="form-group f2">
                    <label className="required-field-label">Razão Social</label>
                    <input defaultValue={info.nome} type="text" className="form-control" name="razaoSocial" required />
                </div>
                <div className="form-group f2">
                    <label>Nome Fantasia</label>
                    <input defaultValue={info.nomeFantasia} type="text" className="form-control" name="nomeFantasia" />
                </div>
                <div className="form-group f2">
                    <label>CNPJ</label>
                    <input type="text" className="form-control" defaultValue={info.cnpj} disabled readOnly />
                </div>
                <div className="form-group f2">
                    <label>Tipo</label>
                    <input type="text" className="form-control" value={info.tipo} disabled readOnly />
                </div>
                <div className="form-group f2">
                    <label>N° da Conta</label>
                    <input type="text" className="form-control" value={info.conta?.numero ?? ''} disabled readOnly />
                </div>
                <div className="form-group f2">
                    <label>Status</label>
                    <input type="text" className="form-control" value={info.status} disabled readOnly />
                </div>

                <div className="formDivider"><p>Contato</p></div>

                <div className="form-group f2">
                    <label>Nome do Responsável</label>
                    <input defaultValue={contato.nomeContato} type="text" className="form-control" name="nomeContato" />
                </div>
                <div className="form-group f2">
                    <label>Celular</label>
                    <InputMask mask="(99)99999-9999" maskChar={null} defaultValue={contato.celular}>
                        {(inputProps) => <input {...inputProps} type="text" className="form-control" name="celular" />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label>Telefone</label>
                    <InputMask mask="(99)9999-9999" maskChar={null} defaultValue={info.telefone}>
                        {(inputProps) => <input {...inputProps} type="text" className="form-control" name="telefone" />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label className="required-field-label">E-mail da Agência</label>
                    <input defaultValue={info.email} type="email" className="form-control" name="emailContato" required />
                </div>
                <div className="form-group">
                    <label>E-mail Secundário</label>
                    <input defaultValue={contato.emailSecundario} type="email" className="form-control" name="emailSecundario" />
                </div>

                <div className="formDivider"><p>Endereço</p></div>

                <div className="form-group">
                    <label>Logradouro</label>
                    <input defaultValue={info.logradouro} type="text" className="form-control" name="logradouro" />
                </div>
                <div className="form-group">
                    <label>Número</label>
                    <input defaultValue={info.numero} type="text" className="form-control" name="numero" />
                </div>
                <div className="form-group">
                    <label>CEP</label>
                    <InputMask mask="99999-999" maskChar={null} defaultValue={info.cep}>
                        {(inputProps) => <input {...inputProps} type="text" name="cep" />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>Complemento</label>
                    <input defaultValue={info.complemento} type="text" className="form-control" name="complemento" />
                </div>
                <div className="form-group">
                    <label>Bairro</label>
                    <input defaultValue={info.bairro} type="text" className="form-control" name="bairro" />
                </div>
                <div className="form-group f2">
                    <label className="required-field-label">Cidade</label>
                    <input defaultValue={info.cidade} type="text" className="form-control" name="cidade" required />
                </div>
                <div className="form-group f1">
                    <label className="required-field-label">Estado (UF)</label>
                    <input defaultValue={info.estado} type="text" className="form-control" name="estado" maxLength={2} required />
                </div>
                <div className="form-group">
                    <label>Região</label>
                    <input defaultValue={info.regiao} type="text" className="form-control" name="regiao" />
                </div>

                <div className="formDivider"><p>Unidade</p></div>

                <PlanosFields type="agencia" defaultValue={info} optional />

                <div className="formDivider"><p>Operações</p></div>

                <div className="form-group">
                    <label>Limite Crédito</label>
                    <RealInput name="limiteCredito" placeholder="Insira o limite" reference={reference}
                        defaultValue={info.limiteCredito ? String(info.limiteCredito) : ''} />
                </div>
                <div className="form-group">
                    <label>Limite de Venda Mensal</label>
                    <RealInput name="limiteVendaMensal" placeholder="Insira o limite" reference={reference}
                        defaultValue={info.limiteVendaMensal ? String(info.limiteVendaMensal) : ''} />
                </div>
                <div className="form-group">
                    <label>Limite de Venda Total</label>
                    <RealInput name="limiteVendaTotal" placeholder="Insira o limite" reference={reference}
                        defaultValue={info.limiteVendaTotal ? String(info.limiteVendaTotal) : ''} />
                </div>
                <div className="form-group">
                    <label>Taxa repasse Matriz em %</label>
                    <input defaultValue={info.taxaRepasseMatriz ?? ''} type="number" className="form-control" name="taxaRepasseMatriz" />
                </div>
                <div className="form-group">
                    <label>Data Vencimento Fatura</label>
                    <select className="form-control" name="dataVencimentoFatura" defaultValue={info.diaVencimentoFatura ?? ''}>
                        <option value="" disabled>Selecionar</option>
                        <option>10</option>
                        <option>20</option>
                        <option>30</option>
                    </select>
                </div>

                <div className="formDivider"><p>Imagem</p></div>

                <div className="formImage">
                    <img src={imagemReference || info.imagemUrl || ''} className="rounded float-left img-fluid" alt="" />
                </div>
                <div className="form-group">
                    <label htmlFor="img_path_ag" className="inputLabel">
                        <BiSolidImageAdd /> Selecione uma imagem
                        <input type="file" accept="image/*" className="custom-file-input" id="img_path_ag" name="imagem"
                            onChange={(e) => imageReferenceHandler(e, setImageReference)} />
                    </label>
                </div>

                <div className="buttonContainer">
                    <ButtonMotion className='modalButtonClose' type='button' onClick={() => closeModal(modalToggle, setSucess, setError)}>Fechar</ButtonMotion>
                    <ButtonMotion className='modalButtonSave' type="submit">Salvar alterações</ButtonMotion>
                </div>
            </form>
        </Modal>
    );
};

export default EditarAgenciaModal;
