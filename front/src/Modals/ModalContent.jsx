import { FaUsers, FaFileInvoiceDollar, FaMoneyBillAlt, FaMoneyCheckAlt, FaUserCog, FaUserPlus, FaListAlt, FaUndo } from 'react-icons/fa';
import { FaFileLines } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { BsFillPersonVcardFill, BsFillPersonPlusFill, BsBuildings, BsBuildingAdd, BsCoin, BsCheck2All, BsTags, BsMegaphone, BsTrash3, BsJournalPlus, BsTicketPerforated, BsTicketPerforatedFill, BsTicketDetailed, BsFillClipboard2DataFill, BsGraphUp, BsPieChartFill } from "react-icons/bs";
import { VscChromeClose } from "react-icons/vsc";
import { isAssociado, isMatriz } from '../hooks/getId';
import { useSnapshot } from 'valtio';
import state from '../store';


const ModalContent = ({ modalItem, modalFunction }) => {
    useSnapshot(state)
    const navigate = useNavigate();
    const handleNavigation = (route) => {
        navigate(route);  // Navega para a rota especificada
        modalFunction()
    };

    var component = []

    switch (modalItem) {
        case 'Associado':
            component = [
                { name: 'Associados', icon: <FaUsers />, route: "/associados" }
            ];
            if (!isAssociado()) {
                component.push(
                    { name: 'Lista de Associados', icon: <BsFillPersonVcardFill />, route: "/associadosLista" },
                    { name: 'Novo Associado', icon: <BsFillPersonPlusFill />, route: "/associadosCadastrar" }
                );
            }
            break;

        case 'Agencias':
            component = [
                { name: 'Agências', icon: <BsBuildings />, route: "/agencias" },
            ];
            if (isMatriz()) {
                component.push(
                    { name: 'Novas Agências', icon: <BsBuildingAdd />, route: "/agenciasCadastrar" }
                );
            }
            break;
        // Adicione casos para outras categorias aqui
        case 'Transações':
            if (isAssociado()) {
                component = [
                    { name: 'Minhas Transações', icon: <BsCoin />, route: "/transacoesMinhas" },
                    { name: 'Nova Transação', icon: <BsCheck2All />, route: "/transacoesCadastrar" },
                ];
            } else {
                component = [
                    { name: 'Transações', icon: <BsCoin />, route: "/transacoes" },
                    { name: 'Minhas Transações', icon: <BsCoin />, route: "/transacoesMinhas" },
                    { name: 'Nova Transação', icon: <BsCheck2All />, route: "/transacoesCadastrar" }
                ];
            }
            break;
        // Adicione casos para outras categorias aqui
        case 'Ofertas':
            component = [
                { name: 'Ofertas', icon: <BsTags />, route: "/ofertas" },
                { name: 'Minhas Ofertas', icon: <BsMegaphone />, route: "/ofertasMinhas" },
            ];

            if (!isAssociado()) {
                component.push(
                    { name: 'Excluir Ofertas', icon: <BsTrash3 />, route: "/ofertasExcluir" }
                );
            }
            component.push(
                { name: 'Nova Oferta', icon: <BsJournalPlus />, route: "/ofertasCadastrar" }
            );
            break;

        // Adicione casos para outras categorias aqui
        case 'Voucher':
            component = []
            if (!isAssociado()) {
                component.push(
                    { name: 'Vouchers', icon: <BsTicketPerforated />, route: "/voucher" },
                );
            }
            component.push(
                { name: 'Meus Vouchers', icon: <BsTicketPerforatedFill />, route: "/voucherMeus" },
            );
            component.push(
                { name: 'Solicitar Voucher', icon: <BsTicketDetailed />, route: "/voucherCadastrar" },
            );
            break;

        // Adicione casos para outras categorias aqui
        case 'Créditos':
            component = [
                { name: 'Meus Créditos', icon: <BsFillClipboard2DataFill />, route: "/creditosMeus" },
                { name: 'Solicitar Crédito', icon: <BsGraphUp />, route: "/creditosSolicitar" },
            ];
            if (!isAssociado()) {
                component.push(
                    { name: 'Créditos', icon: <BsFillClipboard2DataFill />, route: "/creditos" },
                );
            }
            if (!isMatriz() && !isAssociado()) {
                component.push(
                    { name: 'Analisar Créditos', icon: <BsPieChartFill />, route: "/creditosAnalise" },
                );
            }
            if (isMatriz()) {
                component.push(
                    { name: 'Aprovar Créditos', icon: <BsPieChartFill />, route: "/cretidosAprovar" },
                );
            }
            break;
        case 'Extratos':
            component = [
            ];

            if (!isAssociado()) {
                component.push(
                    { name: 'Extratos', icon: <FaFileInvoiceDollar />, route: "/estratos" },
                    { name: 'Meus Extratos', icon: <FaFileLines />, route: "/estratosMeus" },
                    { name: 'Estornos', icon: <FaUndo />, route: "/estratosEstorno" },
                );
            } else {
                component.push(
                    { name: 'Meus Extratos', icon: <FaFileLines />, route: "/estratosMeus" },
                );
            }
            break;
        case 'Conta':
            component = [
            ];

            if (!isAssociado()) {
                component.push(
                    { name: 'Contas a Receber', icon: <FaMoneyBillAlt />, route: "/contasReceber" },
                    { name: 'Contas a Pagar', icon: <FaMoneyCheckAlt />, route: "/contasPagar" }
                );
            } else {
                component.push(
                    { name: 'Contas a Pagar', icon: <FaMoneyCheckAlt />, route: "/contasPagar" }
                );
            }
            break;
        // Adicione casos para outras categorias aqui
        case 'Usuarios':
            // Matriz não tem sub-contas no modelo atual (Usuario é sempre
            // vinculado a um Associado ou Agência) — GET/POST /usuarios nem
            // aceita superadmin, então esses itens nunca funcionariam pra ela.
            component = [
                { name: 'Meus Dados', icon: <FaUserCog />, route: "/usuariosDados" },
            ];
            if (!isMatriz()) {
                component.push(
                    { name: 'Usuários', icon: <FaUsers />, route: "/usuariosLista" },
                    { name: 'Cadastrar Sub Conta', icon: <FaUserPlus />, route: "/usuariosCadastrar" },
                );
            }
            break;
        // Adicione casos para outras categorias aqui
        case 'Planos':
            component = [
                { name: 'Planos Associados', icon: <FaListAlt />, route: "/planosAssociados" },
                { name: 'Planos Agências', icon: <FaListAlt />, route: "/planosAgencias" },
                { name: 'Planos Gerentes', icon: <FaListAlt />, route: "/planosGerentes" },
            ];
            break;
        // Adicione casos para outras categorias aqui
        case 'Categorias':
            component = [
                { name: 'Categorias', icon: <FaListAlt />, route: "/categorias" },
                { name: 'Sub Categorias', icon: <FaListAlt />, route: "/subCategoria" },
            ];
            break;
        // Adicione casos para outras categorias aqui
        case 'Gerentes':
            component = [
                { name: 'Novo Gerente', icon: <FaUserPlus />, route: "/gerentesCadastrar" },
                { name: 'Gerentes', icon: <FaUsers />, route: "/gerentesLista" },
            ];
            break;
        // Adicione casos para outras categorias aqui
        default:
            return
    }
    return (
        <div className="sidebarModal">
            {/* Cabeçalho do modal */}
            <div>
                <div className="sidebarModalHeader">
                    <p>Navegação Rapida</p>
                    <VscChromeClose color="white" onClick={() => modalFunction()} />
                </div>

                {/* Corpo do modal com os componentes clicáveis */}
                <div className='sidebarModalBody'>
                    {component.map((component, index) => (
                        <div key={index} className="sidebarModalItem">
                            {component.icon}
                            <p onClick={() => handleNavigation(component.route)}>{component.name}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ModalContent;
