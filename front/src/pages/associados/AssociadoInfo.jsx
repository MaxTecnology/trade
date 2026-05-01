
import { useEffect } from 'react';
import Footer from '../../components/Footer';
import { activePage } from '../../utils/functions/setActivePage';
import { useQueryCategorias } from '@/hooks/ReactQuery/useQueryCategorias';
import StarRating from '@/components/Stars/StarRating';
const AssociadoInfo = () => {
    const { data: categorias } = useQueryCategorias()
    const storedData = JSON.parse(localStorage.getItem("userCard"))
    const associadoCategoria = categorias && categorias.categorias ? categorias.categorias.find(categoria => categoria.idCategoria === storedData.categoriaId)?.nomeCategoria || "Sem Categoria" : "Sem Categoria"
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
                        <img src={storedData.imagem ? storedData.imagem : "https://cdn.vectorstock.com/i/preview-1x/65/30/default-image-icon-missing-picture-page-vector-40546530.jpg"} alt="" />
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
                            <p><span>Nome de Contato:</span> {storedData.nomeContato}</p>
                            <p><span>Telefone:</span> {storedData.telefone}</p>
                            <p><span>Email:</span> {storedData.emailContato}</p>
                            <p><span>Endereço:</span> {storedData.logradouro}</p>
                            <p><span>Bairro:</span> {storedData.bairro}</p>
                            <p><span>Cidade:</span> {storedData.cidade}</p>
                            <p><span>Site:</span> {storedData.site ? storedData.site : "Associado não possui site"}</p>
                        </div>
                        <div>
                            <h3>Atendimento</h3>
                            <p>
                                {storedData.aceitaVoucher ? "Voucher" : null}
                                {storedData.aceitaVoucher && storedData.aceitaOrcamento ? " / " : null}
                                {storedData.aceitaOrcamento ? "Orçamento" : null}
                                {!storedData.aceitaVoucher && !storedData.aceitaOrcamento ? "Nenhum atendimento selecionado" : null}
                            </p>

                        </div>
                        <div>
                            <h3>Restrições</h3>
                            <p>{storedData.restricao ? storedData.restricao : "Associado não possui restrição"}</p>
                        </div>

                        <h2 className={storedData.status ? "associadoInfoStatus" : "associadoInfoStatus disabled"}>{storedData.status ? "Atendendo" : "Não atendendo"}</h2>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AssociadoInfo;
