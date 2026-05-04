import { useCallback, useEffect, useState } from "react";
import InputMask from 'react-input-mask';
import { ColorRing } from 'react-loader-spinner'
import defaultImage from "@/assets/images/default_img.png"
import Footer from '@/components/Footer';
import RealInput from "@/components/Inputs/CampoMoeda";
import { activePage } from "@/utils/functions/setActivePage";
import { BiSolidImageAdd } from "react-icons/bi";
import { toast } from "sonner";
import PlanosFields from "@/components/Form/PlanosFields";
import useRevalidate from "@/hooks/ReactQuery/useRevalidate";
import api from "@/services/api";

const parseMoney = (val) => {
    if (!val) return undefined
    const str = String(val)
    const cleaned = str.includes(',')
        ? str.replace(/[^0-9,]/g, '').replace(',', '.')
        : str.replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? undefined : num
}

const CadastrarAgencia = () => {
    const [imagemReference, setImageReference] = useState(null);
    const [reference, setReference] = useState(true)
    const [loading, setLoading] = useState(false)

    const handleImagemChange = useCallback((event) => {
        const arquivo = event.target.files[0];
        if (arquivo) {
            const reader = new FileReader();
            reader.onload = (e) => setImageReference(e.target.result);
            reader.readAsDataURL(arquivo);
        }
    }, [])

    useEffect(() => {
        activePage("agencias")
    }, []);

    const revalidate = useRevalidate()

    const formHandler = async (event) => {
        event.preventDefault()

        // Capture form values synchronously BEFORE any state change or async operation.
        const fd = new FormData(event.target)
        const get = (key) => fd.get(key) || undefined
        const imagemFile = event.target.querySelector('input[name="imagem"]')?.files?.[0]

        setLoading(true)
        setReference(false)

        let imagemUrl
        if (imagemFile) {
            try {
                const uploadFd = new FormData()
                uploadFd.append('file', imagemFile)
                const res = await api.post('upload', uploadFd)
                imagemUrl = res.data?.data?.url ?? res.data?.url
            } catch (err) {
                setLoading(false)
                setReference(true)
                toast.error(`Erro ao enviar imagem: ${err?.response?.data?.message ?? err.message}`)
                return
            }
        }

        const payload = {
            nome: get('razaoSocial'),
            nomeFantasia: get('nomeFantasia'),
            cnpj: get('cnpj'),
            inscEstadual: get('inscEstadual'),
            inscMunicipal: get('inscMunicipal'),
            tipo: get('tipo'),
            email: get('emailContato'),
            telefone: get('telefone'),
            imagemUrl,
            agenciaParenteId: get('agenciaParenteId'),
            planoId: get('planoId'),

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

            usuarioNome: get('nome'),
            usuarioCpf: get('cpf'),
            usuarioEmail: get('email'),
            senha: get('senha'),
        }

        toast.promise(
            api.post('agencias', payload).catch((err) => {
                throw new Error(err?.response?.data?.message ?? 'Erro ao cadastrar')
            }),
            {
                loading: 'Cadastrando Agência...',
                success: () => {
                    setLoading(false)
                    setReference(true)
                    setImageReference(null)
                    event.target.reset()
                    revalidate('agencias')
                    return 'Agência cadastrada com sucesso!'
                },
                error: (err) => {
                    setLoading(false)
                    setReference(true)
                    return `Erro: ${err.message}`
                },
            }
        )
    }

    return (
        <div className="container">
            <div className="containerHeader">Cadastrar Agência</div>
            <form onSubmit={formHandler} className="containerForm">
                <div className="form-group f2">
                    <label className="required">Razão Social</label>
                    <input type="text" className="form-control" name="razaoSocial" required />
                </div>
                <div className="form-group f2">
                    <label className="required">Nome Fantasia</label>
                    <input type="text" className="form-control" name="nomeFantasia" />
                </div>
                <div className="form-group f2">
                    <label className="required">CNPJ</label>
                    <InputMask mask="99.999.999/9999-99" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" name="cnpj" required />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>Insc. Estadual</label>
                    <input type="text" className="form-control" name="inscEstadual" />
                </div>
                <div className="form-group">
                    <label>Insc. Municipal</label>
                    <input type="text" className="form-control" name="inscMunicipal" />
                </div>
                <div className="form-group">
                    <label className="required">Tipo</label>
                    <select required className="form-control" name="tipo" defaultValue="">
                        <option value="" disabled>Selecionar</option>
                        <option value="master">Master</option>
                        <option value="comum">Comum</option>
                    </select>
                </div>

                <div className="formDivider"><p>Contato</p></div>

                <div className="form-group f2">
                    <label className="required">Nome</label>
                    <input type="text" className="form-control" name="nomeContato" required />
                </div>
                <div className="form-group f2">
                    <label>Telefone</label>
                    <InputMask mask="(99)9999-9999" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" className="form-control" name="telefone" />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label className="required">Celular</label>
                    <InputMask mask="(99)99999-9999" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" className="form-control" name="celular" required />}
                    </InputMask>
                </div>
                <div className="form-group f2">
                    <label className="required">E-mail da Agência</label>
                    <input type="email" className="form-control" name="emailContato" required />
                </div>
                <div className="form-group f2">
                    <label>E-mail secundário</label>
                    <input type="email" className="form-control" name="emailSecundario" />
                </div>

                <div className="formDivider"><p>Endereço</p></div>

                <div className="form-group">
                    <label className="required">Logradouro</label>
                    <input type="text" className="form-control" name="logradouro" required />
                </div>
                <div className="form-group">
                    <label>Número</label>
                    <input type="number" className="form-control" name="numero" />
                </div>
                <div className="form-group">
                    <label>CEP</label>
                    <InputMask mask="99999-999" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" name="cep" />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>Complemento</label>
                    <input type="text" className="form-control" name="complemento" />
                </div>
                <div className="form-group">
                    <label>Bairro</label>
                    <input type="text" className="form-control" name="bairro" />
                </div>
                <div className="form-group f2">
                    <label className="required">Cidade</label>
                    <input type="text" className="form-control" name="cidade" required />
                </div>
                <div className="form-group f1">
                    <label className="required">Estado (UF)</label>
                    <input type="text" className="form-control" name="estado" maxLength={2} required />
                </div>
                <div className="form-group">
                    <label>Região</label>
                    <input type="text" className="form-control" name="regiao" />
                </div>

                <div className="formDivider"><p>Unidade</p></div>

                <PlanosFields type="agencia" optional />

                <div className="formDivider"><p>Operações</p></div>

                <div className="form-group">
                    <label>Limite Crédito</label>
                    <RealInput name="limiteCredito" placeholder="Insira o limite" reference={reference} />
                </div>
                <div className="form-group">
                    <label>Limite de Venda Mensal</label>
                    <RealInput name="limiteVendaMensal" placeholder="Insira o limite" reference={reference} />
                </div>
                <div className="form-group">
                    <label>Limite de Venda Total</label>
                    <RealInput name="limiteVendaTotal" placeholder="Insira o limite" reference={reference} />
                </div>
                <div className="form-group">
                    <label>Taxa repasse Matriz em %</label>
                    <input type="number" className="form-control" name="taxaRepasseMatriz" />
                </div>
                <div className="form-group">
                    <label>Data Vencimento Fatura</label>
                    <select className="form-control" name="dataVencimentoFatura" defaultValue="">
                        <option value="" disabled>Selecionar</option>
                        <option>10</option>
                        <option>20</option>
                        <option>30</option>
                    </select>
                </div>

                <div className="formDivider"><p>Dados do usuário</p></div>

                <div className="formImage">
                    <img src={imagemReference ?? defaultImage} className="rounded float-left img-fluid" alt="" id="imagem-selecionada" />
                </div>
                <div className="form-group">
                    <label htmlFor="img_path" className="inputLabel">
                        <BiSolidImageAdd /> Selecione uma imagem
                        <input type="file" id="img_path" name="imagem" accept="image/*" className="custom-file-input" onChange={handleImagemChange} />
                    </label>
                </div>
                <div className="form-group">
                    <label>Nome</label>
                    <input type="text" className="form-control" name="nome" />
                </div>
                <div className="form-group">
                    <label>CPF</label>
                    <InputMask mask="999.999.999-99" maskChar={null}>
                        {(inputProps) => <input {...inputProps} type="text" className="form-control" name="cpf" />}
                    </InputMask>
                </div>
                <div className="form-group">
                    <label>E-mail do usuário</label>
                    <input type="email" className="form-control" name="email" />
                </div>
                <div className="form-group">
                    <label>Senha</label>
                    <input type="password" className="form-control" name="senha" />
                </div>

                <div className="buttonContainer">
                    {loading
                        ? <ColorRing visible height="33" width="33" ariaLabel="blocks-loading" colors={['#2d6cdf', '#2d6cdf', '#2d6cdf', '#2d6cdf', '#2d6cdf']} />
                        : <button className="purpleBtn" type="submit">Cadastrar</button>}
                </div>
            </form>
            <Footer />
        </div>
    )
};

export default CadastrarAgencia;
