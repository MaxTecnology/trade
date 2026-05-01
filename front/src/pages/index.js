import { lazy } from 'react';
const Login = lazy(() => import('@/pages/Login'));
const PlanoAgencias = lazy(() => import('@/pages/planos/PlanoAgencias'));
const PlanoAssociado = lazy(() => import('@/pages/planos/PlanoAssociado'));
const PlanoGerente = lazy(() => import('@/pages/planos/PlanoGerente'));
const CadastrarAssociado = lazy(() => import('@/pages/associados/CadastrarAssociado'));
const AssociadosLista = lazy(() => import('@/pages/associados/AssociadosLista'));
const Categorias = lazy(() => import('@/pages/categorias/Categorias'));
const SubCategorias = lazy(() => import('@/pages/categorias/SubCategorias'));
const Associados = lazy(() => import('@/pages/associados/Associados'));
const CadastrarAgencia = lazy(() => import('@/pages/agencias/CadastrarAgencia'));
const AgenciasLista = lazy(() => import('@/pages/agencias/AgenciasLista'));
const GerentesCadastrar = lazy(() => import('@/pages/gerentes/GerentesCadastrar'));
const GerentesLista = lazy(() => import('@/pages/gerentes/GerentesLista'));
const OfertasCadastrar = lazy(() => import('@/pages/ofertas/OfertasCadastrar'));
const Ofertas = lazy(() => import('@/pages/ofertas/Ofertas'));
const OfertasInfo = lazy(() => import('@/pages/ofertas/OfertasInfo'));
const OfertasMinhas = lazy(() => import('@/pages/ofertas/OfertasMinhas'));
const OfertasExcluir = lazy(() => import('@/pages/ofertas/OfertasExcluir'));
const Transações = lazy(() => import('@/pages/transacoes/Transações'));
const TransaçãoCadastrar = lazy(() => import('@/pages/transacoes/TransaçãoCadastrar'));
const VoucherCadastrar = lazy(() => import('@/pages/vouchers/VoucherCadastrar'));
const Vouchers = lazy(() => import('@/pages/vouchers/Vouchers'));
const Home = lazy(() => import('@/pages/dashboard/Home'));
const AssociadoInfo = lazy(() => import('@/pages/associados/AssociadoInfo'));
const Credito = lazy(() => import('@/pages/creditos/Credito'));
const CreditoSolicitar = lazy(() => import('@/pages/creditos/CreditoSolicitar'));
const CreditoAnalise = lazy(() => import('@/pages/creditos/CreditoAnalise'));
const Extratos = lazy(() => import('@/pages/estratos/Extratos'));
const ContasPagar = lazy(() => import('@/pages/contas/ContasPagar'));
const ContasReceber = lazy(() => import('@/pages/contas/ContasReceber'));
const MeusExtratos = lazy(() => import('@/pages/estratos/MeusExtratos'));
const MeusVouchers = lazy(() => import('@/pages/vouchers/MeusVouchers'));
const CancelarVouchers = lazy(() => import('@/pages/vouchers/CancelarVouchers'));
const TransaçõesMinhas = lazy(() => import('@/pages/transacoes/TransaçõesMinhas.jsx'));
const PDFVoucher = lazy(() => import('@/components/PDFVoucher.jsx'));
const CreditoMeus = lazy(() => import('@/pages/creditos/CreditoMeus.jsx'));
const VoucherSolicitarCancelar = lazy(() => import('@/pages/vouchers/VoucherSolicitarCancelar.jsx'));
const CreditoAprovar = lazy(() => import('@/pages/creditos/CreditoAprovar.jsx'));
const UsuariosMeus = lazy(() => import('@/pages/usuarios/UsuariosMeus.jsx'));
const UsuariosCadastrar = lazy(() => import('@/pages/usuarios/UsuariosCadastrar.jsx'));
const UsuariosLista = lazy(() => import('@/pages/usuarios/UsuariosLista.jsx'));
const UsuariosDados = lazy(() => import('@/pages/usuarios/UsuariosDados.jsx'))
const TransaçõesExtorno = lazy(() => import('@/pages/transacoes/TransaçõesExtorno.jsx'))
const EstratosEstorno = lazy(() => import('@/pages/estratos/ExtratosEstorno.jsx'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword.jsx'))
export {
    Login,
    PlanoAssociado,
    PlanoGerente,
    CadastrarAssociado,
    AssociadosLista,
    Categorias,
    SubCategorias,
    Associados,
    CadastrarAgencia,
    AgenciasLista,
    GerentesCadastrar,
    GerentesLista,
    OfertasCadastrar,
    Ofertas,
    OfertasInfo,
    OfertasMinhas,
    OfertasExcluir,
    Transações,
    TransaçãoCadastrar,
    VoucherCadastrar,
    Vouchers,
    Home,
    AssociadoInfo,
    Credito,
    CreditoSolicitar,
    CreditoAnalise,
    Extratos,
    ContasPagar,
    ContasReceber,
    MeusExtratos,
    MeusVouchers,
    CancelarVouchers,
    TransaçõesMinhas,
    PDFVoucher,
    CreditoMeus,
    VoucherSolicitarCancelar,
    CreditoAprovar,
    UsuariosMeus,
    UsuariosCadastrar,
    UsuariosLista,
    PlanoAgencias,
    UsuariosDados,
    TransaçõesExtorno,
    EstratosEstorno,
    ResetPassword
};