import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './globals.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
// ==================================================================
// CONTEXT
// ==================================================================
import { AuthProvider } from './auth/AuthContext.jsx';
import IsAuth from './auth/isAuth.jsx';
import RequireAuth from './auth/RequireAuth.jsx'


// PAGES
import { AgenciasLista, AssociadoInfo, Associados, AssociadosLista, CadastrarAgencia, CadastrarAssociado, CancelarVouchers, Categorias, ContasPagar, ContasReceber, Credito, CreditoAnalise, CreditoAprovar, CreditoMeus, CreditoSolicitar, EstratosEstorno, Extratos, GerentesCadastrar, GerentesLista, Home, Login, MeusExtratos, MeusVouchers, Ofertas, OfertasCadastrar, OfertasExcluir, OfertasInfo, OfertasMinhas, PDFVoucher, PlanoAgencias, PlanoAssociado, PlanoGerente, ResetPassword, SubCategorias, TransaçãoCadastrar, Transações, TransaçõesExtorno, TransaçõesMinhas, UsuariosCadastrar, UsuariosDados, UsuariosLista, UsuariosMeus, VoucherCadastrar, Vouchers, VoucherSolicitarCancelar } from './pages/index.js'
import Loading from './pages/Loading.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(

  <React.StrictMode>
    <Toaster richColors position='top-center' />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={
            <Suspense fallback={<Loading />}>
              <Login />
            </Suspense>
          } />
          <Route path="/pdfVoucher" element={<PDFVoucher />} />
          <Route path="/resetPassword" element={<ResetPassword />} />
          <Route exact path="/" element={<App />}>
            <Route exact path="/" element={
              <Suspense fallback={<Loading />}>
                <Home />
              </Suspense>
            } />
            {/* Associados */}
            <Route
              path="/associadosCadastrar"
              element={
                <Suspense fallback={<Loading />}>
                  <CadastrarAssociado />
                </Suspense>
              }
            />
            <Route
              path="/associados"
              element={
                <Suspense fallback={<Loading />}>
                  <Associados />
                </Suspense>
              }
            />
            <Route
              path="/associadosLista"
              element={
                <Suspense fallback={<Loading />}>
                  <AssociadosLista />
                </Suspense>
              }
            />
            <Route
              path="/associadoInfo"
              element={
                <Suspense fallback={<Loading />}>
                  <AssociadoInfo />
                </Suspense>
              }
            />

            {/* Agencias */}
            <Route
              path="/agenciasCadastrar"
              element={
                <Suspense fallback={<Loading />}>
                  <CadastrarAgencia />
                </Suspense>
              }
            />
            <Route
              path="/agencias"
              element={
                <Suspense fallback={<Loading />}>
                  <AgenciasLista />
                </Suspense>
              }
            />

            {/* Transações */}
            <Route
              path="/transacoes"
              element={
                <Suspense fallback={<Loading />}>
                  <Transações />
                </Suspense>
              }
            />
            <Route
              path="/transacoesCadastrar"
              element={
                <Suspense fallback={<Loading />}>
                  <TransaçãoCadastrar />
                </Suspense>
              }
            />
            <Route
              path="/transacoesMinhas"
              element={
                <Suspense fallback={<Loading />}>
                  <TransaçõesMinhas />
                </Suspense>
              }
            />
            <Route
              path="/transacoesExtorno"
              element={
                <Suspense fallback={<Loading />}>
                  <TransaçõesExtorno />
                </Suspense>
              }
            />

            {/* Ofertas */}
            <Route
              path="/ofertas"
              element={
                <Suspense fallback={<Loading />}>
                  <Ofertas />
                </Suspense>
              }
            />
            <Route
              path="/ofertasMinhas"
              element={
                <Suspense fallback={<Loading />}>
                  <OfertasMinhas />
                </Suspense>
              }
            />
            <Route
              path="/ofertasCadastrar"
              element={
                <Suspense fallback={<Loading />}>
                  <OfertasCadastrar />
                </Suspense>
              }
            />
            <Route
              path="/ofertasInfo"
              element={
                <Suspense fallback={<Loading />}>
                  <OfertasInfo />
                </Suspense>
              }
            />
            <Route
              path="/ofertasExcluir"
              element={
                <Suspense fallback={<Loading />}>
                  <OfertasExcluir />
                </Suspense>
              }
            />
            {/* Voucher */}
            <Route
              path="/voucherCadastrar"
              element={
                <Suspense fallback={<Loading />}>
                  <VoucherCadastrar />
                </Suspense>
              }
            />
            <Route
              path="/voucher"
              element={
                <Suspense fallback={<Loading />}>
                  <Vouchers />
                </Suspense>
              }
            />
            <Route
              path="/voucherMeus"
              element={
                <Suspense fallback={<Loading />}>
                  <MeusVouchers />
                </Suspense>
              }
            />
            <Route
              path="/cancelarVouchers"
              element={
                <Suspense fallback={<Loading />}>
                  <MeusVouchers />
                </Suspense>
              }
            />
            <Route
              path="/voucherCancelar"
              element={
                <Suspense fallback={<Loading />}>
                  <CancelarVouchers />
                </Suspense>
              }
            />
            <Route
              path="/voucherSolicitarCancelar"
              element={
                <Suspense fallback={<Loading />}>
                  <VoucherSolicitarCancelar />
                </Suspense>
              }
            />

            {/* Financeiro */}
            <Route
              path="/creditos"
              element={
                <Suspense fallback={<Loading />}>
                  <Credito />
                </Suspense>
              }
            />
            <Route
              path="/creditosMeus"
              element={
                <Suspense fallback={<Loading />}>
                  <CreditoMeus />
                </Suspense>
              }
            />
            <Route
              path="/creditosSolicitar"
              element={
                <Suspense fallback={<Loading />}>
                  <CreditoSolicitar />
                </Suspense>
              }
            />
            <Route
              path="/cretidosAprovar"
              element={
                <Suspense fallback={<Loading />}>
                  <CreditoAprovar />
                </Suspense>
              }
            />
            <Route
              path="/creditosAnalise"
              element={
                <Suspense fallback={<Loading />}>
                  <CreditoAnalise />
                </Suspense>
              }
            />
            <Route
              path="/estratos"
              element={
                <Suspense fallback={<Loading />}>
                  <Extratos />
                </Suspense>
              }
            />
            <Route
              path="/estratosMeus"
              element={
                <Suspense fallback={<Loading />}>
                  <MeusExtratos />
                </Suspense>
              }
            />
            <Route
              path="/estratosEstorno"
              element={
                <Suspense fallback={<Loading />}>
                  <EstratosEstorno />
                </Suspense>
              }
            />
            <Route
              path="/contasPagar"
              element={
                <Suspense fallback={<Loading />}>
                  <ContasPagar />
                </Suspense>
              }
            />
            <Route
              path="/contasReceber"
              element={
                <Suspense fallback={<Loading />}>
                  <ContasReceber />
                </Suspense>
              }
            />

            {/* Planos */}
            <Route
              path="/planosAgencias"
              element={
                <Suspense fallback={<Loading />}>
                  <PlanoAgencias />
                </Suspense>
              }
            />
            <Route
              path="/planosAssociados"
              element={
                <Suspense fallback={<Loading />}>
                  <PlanoAssociado />
                </Suspense>
              }
            />
            <Route
              path="/planosGerentes"
              element={
                <Suspense fallback={<Loading />}>
                  <PlanoGerente />
                </Suspense>
              }
            />
            {/* Categorias */}
            <Route
              path="/categorias"
              element={
                <Suspense fallback={<Loading />}>
                  <Categorias />
                </Suspense>
              }
            />
            <Route
              path="/subCategoria"
              element={
                <Suspense fallback={<Loading />}>
                  <SubCategorias />
                </Suspense>
              }
            />

            {/* Gerentes */}
            <Route
              path="/gerentesCadastrar"
              element={
                <Suspense fallback={<Loading />}>
                  <GerentesCadastrar />
                </Suspense>
              }
            />
            <Route
              path="/gerentesLista"
              element={
                <Suspense fallback={<Loading />}>
                  <GerentesLista />
                </Suspense>
              }
            />

            {/* Usuários */}
            <Route
              path="/usuariosDados"
              element={
                <Suspense fallback={<Loading />}>
                  <UsuariosDados />
                </Suspense>
              }
            />
            <Route
              path="/usuariosLista"
              element={
                <Suspense fallback={<Loading />}>
                  <UsuariosLista />
                </Suspense>
              }
            />
            <Route
              path="/usuariosEditar"
              element={
                <Suspense fallback={<Loading />}>
                  <UsuariosMeus />
                </Suspense>
              }
            />
            <Route
              path="/usuariosCadastrar"
              element={
                <Suspense fallback={<Loading />}>
                  <UsuariosCadastrar />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>

)
