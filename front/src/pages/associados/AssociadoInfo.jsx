
import { useEffect } from 'react';
import Footer from '../../components/Footer';
import { activePage } from '../../utils/functions/setActivePage';
import { useQueryCategorias } from '@/hooks/ReactQuery/useQueryCategorias';
import StarRating from '@/components/Stars/StarRating';
const AssociadoInfo = () => {
    const { data: categorias } = useQueryCategorias()
    const storedData = JSON.parse(localStorage.getItem("userCard")) ?? {}
    const contato = storedData.contatos?.[0] ?? {}
    const categoriasArr = Array.isArray(categorias) ? categorias : []
    const associadoCategoria = categoriasArr.find(c => c.id === storedData.categoriaId)?.nome ?? "Sem Categoria"
    useEffect(() => {
        activePage("associados")
    }, []);
    return (
        <div className="container">
            <div className="containerHeader">Informações Associado</div>
            <div className="associadoInfoContainer">
                <h1>{storedData.nomeFantasia}</h1>
                <div className="associadoInfo">
                    <div className='associadoImage'>
                        <img src={storedData.imagemUrl || "https://cdn.vectorstock.com/i/preview-1x/65/30/default-image-icon-missing-picture-page-vector-40546530.jpg"} alt="" />
                    </div>
                    <div className="associadoInfoItens">
                        <h2 className="associadoInfoCategoria">{associadoCategoria}</h2>
                        <div>
                            <h3>Descrição</h3>
                            <p>{storedData.descricao}</p>
                        </div>
                        <div>
                            <h3>Informações</h3>
                            <div className='flex items-center gap-2'>
                                <span>Score: </span>
                                <StarRating rating={storedData.reputacao} />
                            </div>
                            <p><span>Nome de Contato:</span> {contato.nomeContato}</p>
                            <p><span>Telefone:</span> {storedData.telefone || contato.celular}</p>
                            <p><span>Email:</span> {storedData.email || contato.emailContato}</p>
                            <p><span>Endereço:</span> {storedData.logradouro}</p>
                            <p><span>Bairro:</span> {storedData.bairro}</p>
                            <p><span>Cidade:</span> {storedData.cidade}</p>
                            <p><span>Site:</span> {contato.site || "Associado não possui site"}</p>
                        </div>
                        <div>
                            <h3>Atendimento</h3>
                            <p>
                                {storedData.tipoAtendimento?.length
                                    ? storedData.tipoAtendimento.join(' / ')
                                    : "Nenhum atendimento selecionado"}
                            </p>
                        </div>
                        <div>
                            <h3>Restrições</h3>
                            <p>{storedData.restricao ? storedData.restricao : "Associado não possui restrição"}</p>
                        </div>

                        <h2 className={storedData.status === 'ativo' ? "associadoInfoStatus" : "associadoInfoStatus disabled"}>{storedData.status === 'ativo' ? "Atendendo" : "Não atendendo"}</h2>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AssociadoInfo;
