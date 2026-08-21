# Débito técnico — Rede Trade

## [RESOLVIDO 2026-08-21] Meu Extrato com colunas demais — movidas pro modal de Detalhes

Pedido do usuário: tabela de Meu Extrato densa demais. Removidas as colunas Código/Tipo/Operação(Débito-Crédito)/Iniciado por da tabela — ficou só Data/Valor/Saldo Após/Descrição/Status. `TransaçõesModal.jsx` (botão de olho, compartilhado com várias telas) ganhou essas colunas de volta, mais completo: Código/Data/Operação/Saldo Após (só quando a linha é uma MovimentacaoConta — detectado via `saldoApos !== undefined`) e Tipo/Iniciado por (quando há transação real vinculada).

**Bug achado e corrigido no processo**: pra uma MovimentacaoConta sem transação vinculada (ex: crédito puro aprovado pela Matriz, sem `Transacao` associada), o fallback `info?.transacao ?? info` fazia `transacao` virar a própria movimentação — e `transacao.tipo` colidia com o campo `tipo` do lançamento (débito/crédito), mostrando "Tipo: credito" errado (duplicava "Operação: Crédito" com um significado diferente). Corrigido lendo `info?.transacao?.tipo` explicitamente nesse caso, só mostrando "Tipo" quando existe transação de verdade.

**Validado**: Docker + Playwright real — tabela sem as 4 colunas, modal mostra tudo certo pra linha sem transação (sem "Tipo") e pra linha com transação real (Tipo + Iniciado por aparecem).

## [RESOLVIDO 2026-08-21] Operador via "Usuários"/"Cadastrar Sub Conta" no menu sem ter acesso

Reportado pelo usuário: a "Navegação Rápida" de Usuários só escondia os itens pra Matriz (`isMatriz()`), mas `GET/POST /usuarios` é `adminGuard` (só `associate_admin`/`agency_admin`) — operador e gerente também tomariam 403 clicando ali, mesmo problema que já tinha sido corrigido pra Matriz antes.

**O que mudou:** novo helper `isAdminEntidade()` em `getId.js` (mesma checagem do `adminGuard` do backend — `role === 'associate_admin' || role === 'agency_admin'`), substitui `!isMatriz()` em `ModalContent.jsx`. "Usuários"/"Cadastrar Sub Conta" só aparecem pra quem realmente tem acesso.

**Validado**: Docker + Playwright real — operador recém-criado loga e vê só "Meus Dados" no popup.

## [RESOLVIDO 2026-08-21] Formulário de "Permissões" no Cadastrar Sub Conta era 100% decorativo

Pedido do usuário: validar as permissões ao criar uma sub-conta. Achado: o formulário inteiro (Conta/Financeiro/Operacional, Leitura/Escrita/Exclusão por módulo, accordion com "Selecionar Todas") nunca teve efeito nenhum — não existe **nenhum campo de permissão no banco** (`schema.prisma` não tem nada parecido), `createUserSchema` no backend só aceita `nome/email/senha/role`, e `createSubAccount()` no front descartava tudo que não fosse esses 4 campos antes mesmo de montar a requisição. Um admin marcando "operador só pode ler" não tinha efeito algum.

O controle real de acesso é só por `role` (admin vs operador), fixo no código de cada rota — não configurável por usuário. Resumo do que `associate_operator` pode/não pode (auditado via `roleGuard` de cada módulo): pode comprar/negociar/avaliar/ver extrato, **não pode** transferir RT, ver/editar dados do Associado, ver o próprio saldo (`/associados/:id/conta` é admin-only), abrir/fechar loja, nem gerenciar outros usuários.

**O que mudou:** removida a seção "Permissões" de `UsuariosCadastrar.jsx` (e o import de `FormPermissions`). Deletados os arquivos que só existiam pra essa UI fake: `components/Form/permissions/` (4 arquivos), `FormCheckBox.jsx`, e `pages/usuarios/UsuariosCadastrar copy.jsx` (cópia morta, nunca roteada, único outro consumidor dos arrays `options`/`vendas`/`voucher`/`leitura`/`extrato` de `constants.js`, também removidos). `permissionsSchema.js` reduzido aos campos reais (nome/email/senha/cpf/imagem) — nome do arquivo mantido pra não quebrar o import.

**Não implementado agora** (fora de escopo, registrado se algum dia quiser): permissões granulares de verdade (tabela no banco + guard por permissão, não só role) seria um projeto à parte, não um ajuste pontual.

**Validado**: Docker + Playwright real — seção "Permissões" não aparece mais na tela, cadastro de sub-conta continua funcionando normalmente sem ela.

## [RESOLVIDO 2026-08-21] "Quem iniciou a transação" era rastreado mas nunca exposto; código de usuário só existia pra metade dos casos

Pergunta do usuário: dado que o sistema já sabe quem fez cada compra (`Transacao.usuarioIniciadorId`, sempre preenchido com `request.user.id`), vale a pena criar um "número de conta" por usuário? Achado: **já existia** um mecanismo pra isso — `Usuario.codigoOperador` (`{numeroDaConta}-{sequencial}`) — só que pela metade: só gerado pra `associate_operator`, nunca pro `associate_admin` nem pro lado da Agência (`agency_admin`/`agency_operator`), e nunca lido/exibido em lugar nenhum do front.

**O que mudou:**
- `codigoOperador` agora é gerado pra **todo** usuário novo, nas 3 rotas de criação (`associate.service.ts`/`agency.service.ts` pro admin — sempre `-01`, criado junto com a Conta; `user.service.ts::create()` generalizado pra qualquer role, não só `associate_operator`). Helper compartilhado `proximoCodigoOperador()` em `shared/utils/conta.ts`.
- Usuários já existentes sem código corrigidos via `api/scripts/backfill-codigo-operador.ts` (idempotente, roda uma vez — **precisa rodar em produção depois do deploy**, `npx tsx scripts/backfill-codigo-operador.ts` com o `DATABASE_URL` do ambiente).
- `usuarioIniciador: {nome, codigoOperador}` incluído em `transaction.service.ts` (`list`/`getById`) e `report.service.ts` (`extrato`/`relatorioPermutas`) — antes nunca era buscado.
- Nova coluna "Iniciado por" em Transações Minhas, Transações (Agência/Matriz), Meu Extrato e Extratos — mostra o código (`0000004-01`) ou o nome quando não tem código (Matriz, que fica de fora do mecanismo por não ser Associado/Agência).
- Nova coluna "Código" na própria lista de Usuários (`pages/usuarios/constants.js`), pedida em seguida pelo usuário.

**Validado**: backfill rodado no ambiente de dev (3 usuários corrigidos), Docker + Playwright real confirmando a coluna nova em Transações Minhas e Meu Extrato, com código aparecendo certo pra quem tem e nome pra quem não tem (Matriz).

## [RESOLVIDO 2026-08-21] Sub-conta: busca errada, redefinir senha, e-mail travado

Continuação da revisão de "Sub Contas": (1) `UsuariosLista.jsx` usava `SearchField.jsx` — barra de busca da tela **Associados** (Agência/Categoria/Estado/Cidade, botão "+ Novo Associado"), nenhum campo batendo com `Usuario`; (2) pedido do usuário: permitir ao admin redefinir a senha de um usuário que esqueceu, sem poder editar o e-mail (histórico de movimentações fica ligado ao e-mail).

**O que mudou:**
- Novo `SearchUsuarios.jsx` — Nome/E-mail (busca livre), Perfil e Status (selects reais, com `filterFn` nas colunas de `constants.js`), botão "Cadastrar Sub Conta" (rota certa). Opções de Perfil mudam conforme `isAgencia()` (agency_* vs associate_*).
- Novo endpoint `PATCH /usuarios/:id/senha/redefinir` (`associate_admin`/`agency_admin`, mesmo tenant via `getById`) — **diferente** de `PATCH /usuarios/:id/senha` (self-only, exige senha atual): esse não exige, é pro caso de esquecimento. `EditarUsuariosModal.jsx` ganhou campo "Nova senha" opcional — só manda a requisição se preenchido.
- E-mail virou somente leitura no modal — não é mais enviado no `PUT /usuarios/:id`.

**Validado**: Docker + Playwright real — filtro de Perfil reduz a lista corretamente, campo de e-mail confirmado `readOnly`, reset de senha gravou hash novo no banco (confirmado via SQL, senha restaurada depois pra não quebrar outros testes).

## [RESOLVIDO 2026-08-21] Área inteira de "Sub Contas" (Usuários) quebrada — análise + reescrita

Pedido pelo usuário: analisar "Usuários"/"Editar Sub Contas"/"Cadastrar Sub Conta" antes de mexer, com suspeita de que "Editar Sub Contas" fosse redundante. Achado bem mais extenso do que isso — cada camada tinha um bug diferente:

1. **"Usuários" e "Editar Sub Contas" eram a mesma coisa**: `useQueryMeusUsuarios`/`useQuerySubContas` chamavam o **mesmo endpoint** (`GET /usuarios`, já auto-escopado no backend — `associate_admin` só vê seus operadores, `agency_admin` só os da própria agência; não existe "ver todo mundo"). "Usuários" passava o envelope inteiro (`{success,data,meta}`) pra tabela em vez de `.data` (quebrado pra Agência/Associado); "Editar Sub Contas" procurava `data.subcontas`, campo que nunca existiu (sempre vazio).
2. **Matriz nunca teve acesso**: `GET/POST /usuarios` só aceita `associate_admin`/`agency_admin` — superadmin nem está na lista de roles. Não existe conceito de "sub-conta da Matriz" no modelo (Usuario sempre pertence a um Associado ou uma Agência).
3. **`constants.js`** (colunas da lista) usava campos de Associado (`nomeFantasia`, `conta.numeroConta`, `conta.nomeFranquia`, `status` booleano) — nenhum existe em `Usuario` (`nome`/`email`/`role`/`ativo`). Lista sempre mostrava lixo ("Nenhuma Franquia", "Não Atendendo").
4. **`EditarUsuariosModal.jsx`** era uma cópia do formulário de editar Associado/Agência inteiro (CNPJ, endereço, limites, plano) — nada disso existe em `Usuario`. E o pior: `updateUser` (função de salvar) era **um no-op literal** (`() => {}`) — "Salvar alterações" mostrava toast de sucesso sem nunca chamar a API.
5. **`AssociadosTable.jsx`** (reaproveitada pra listar Usuarios) tinha um botão de bloquear/desbloquear hardcoded pra `PATCH /associados/:id/status` com `associado.status` — pra uma linha de Usuario isso é `PATCH` no id errado (usuário, não associado) comparando um campo que não existe (`status` em vez de `ativo`) — sempre falhava.
6. **`createSubAccount`** (Cadastrar Sub Conta) tinha `role: 'associate_operator'` fixo no código — `agency_admin` cadastrando um operador sempre tomava 403 (`roleCompatível` do backend rejeita `associate_operator` vindo de quem é Agência). Só funcionava pra Associado.

**O que mudou:**
- `UsuariosMeus.jsx` (+ rota `/usuariosEditar`, hooks `useQueryMeusUsuarios`/`useQuerySubContas`) removidos — "Usuários" é a única tela agora, com `useQueryUsuarios()` direto e `.data` desembrulhado certo.
- `constants.js` reescrito com campos reais de Usuario (Nome/E-mail/Perfil/Status).
- `EditarUsuariosModal.jsx` reescrito do zero — Nome, E-mail, Perfil (somente leitura), Status. `updateUser` virou uma função de verdade: `PUT /usuarios/:id` (nome/email) + `PATCH /usuarios/:id/status` (ativo). Sem campo de senha — `PATCH /usuarios/:id/senha` é self-only por design de segurança (exige a senha atual de quem está trocando), um admin não pode resetar a senha de outra pessoa por essa rota.
- `AssociadosTable.jsx` ganhou prop `usuario` — quando true, o botão de bloquear/desbloquear usa `PATCH /usuarios/:id/status` com `ativo` (boolean), e o botão "Eye" (que abriria a página de Associado) fica escondido, já que não faz sentido pra uma linha de Usuario.
- `createSubAccount` detecta o role certo (`isAgencia() ? 'agency_operator' : 'associate_operator'`) em vez de fixo; parou de mandar `associadoId`/`imagem` no body (o schema de criação nem aceita esses campos — eram só ruído, e o upload de imagem nunca era referenciado em lugar nenhum depois).
- `ModalContent.jsx`: Matriz só vê "Meus Dados" na "Navegação Rápida" de Usuários — os outros 3 itens nunca funcionariam pra ela mesmo (confirmado com o usuário).

**Validado**: Docker + Playwright real — Matriz vê só "Meus Dados"; Associado vê a lista certa e edita um usuário de verdade (nome mudou no banco, confirmado via SQL); Agência cadastra um operador com sucesso, `role: agency_operator` e `agenciaId` corretos no banco (antes sempre 403).

## [RESOLVIDO 2026-08-21] Limpar filtro de Período zerava a tabela; "Selecione" confuso; mês atual como padrão

Reportado pelo usuário: (1) "Selecione" no filtro de Associado/Agência não deixava claro que representa "todos"; (2) limpar as datas do filtro de Período fazia a tabela sumir inteira em vez de voltar a mostrar tudo; (3) sugestão de deixar o mês atual pré-selecionado ao abrir a tela.

**Causa raiz do (2):** `filterStart`/`filterEnd` (`utils/functions/tables/date.js`) faziam `Date.parse(filterStatuses)` sem checar se o valor estava vazio — campo de data limpo vira `""`, `Date.parse("")` é `NaN`, e qualquer comparação com `NaN` é sempre `false` em JS. `filterStart` sem essa guarda retornava `false` (esconde) pra **toda** linha quando a data de início estava vazia.

**O que mudou:**
- `filterStart`/`filterEnd` ganham guarda `if (!filterStatuses) return true` — mesmo padrão já usado em `filterIncludes`/`filterIncludesId`.
- `filterEnd` também passou a tratar `dataTermino` como o dia inteiro (inclusive), somando 1 dia antes de comparar — sem isso, qualquer coisa criada no próprio dia escolhido (ex: "hoje") ficava de fora, porque o `<input type="date">` vira meia-noite UTC daquele dia. Replicado em `estornoFilters.js`/`meuExtratoFilters.js` (mesma lógica duplicada pro "Gerar PDF", ver itens anteriores).
- `ExtratosSearch.jsx`: opção vazia dos selects de Associado/Agência virou "Todos"/"Todas" (antes "Selecione"/"Selecionar").
- Novo `currentMonthRange()` em `date.js` — Período abre pré-preenchido com o mês atual (dia 1 até hoje) nas 3 telas que usam esse filtro (Extratos, Estornos, Meu Extrato). Usuário pode trocar ou limpar livremente depois — limpar volta a mostrar tudo (não trava a escolha, decisão confirmada com o usuário).

**Validado**: Docker + Playwright real — datas padrão corretas ao abrir, limpar as duas datas volta a mostrar todas as linhas, movimentação criada no próprio dia aparece com o filtro padrão do mês ativo.

## [RESOLVIDO 2026-08-21] Meu Extrato: filtros sem dado, modal sem comprador/vendedor, 403 em loop

Reportado ao vivo depois do fix do "Gerar PDF": filtros de Comprador/Vendedor não funcionavam, "Detalhes da Transação" mostrava Vendedor/Comprador em branco, e o console tinha chamadas repetidas de `GET /agencias` retornando 403. O usuário corretamente suspeitou que os dois primeiros estavam ligados.

**Causa raiz (comprador/vendedor em branco):** `report.service.ts::extrato()` nunca incluía `comprador`/`vendedor` no `include` aninhado de `transacao` — só `voucher` e `solicitacoesEstorno`. `TransaçõesModal.jsx` já lia os campos certos (`transacao.comprador.nome`), só não recebia o dado.

**Causa raiz (403 em loop):** `AgenciasOptions.jsx` (select de Agência, reaproveitado em várias telas) chamava `GET /agencias` sem checar role — essa rota é `superadmin`-only. Pra Associado/Agência, cada chamada falhava e o retry automático do react-query tentava de novo (3x por padrão), gerando a sequência de 403 no console.

**O que mudou:** `include` de `extrato()` ganhou `comprador`/`vendedor` (id/nome/agenciaId) e `contaOrigem`/`contaDestino` (agenciaId), mesmo padrão já usado em Estornos. `constantsMeuExtrato.js` ganhou as 4 colunas ocultas de filtro (comprador/vendedor/agencia/associado) que faltavam — mesma classe de bug já corrigida em Estornos/Extratos/Créditos nesta sessão. `useQueryAgencias`/`AgenciasOptions.jsx` ganharam `enabled`, chamando a rota só quando `isMatriz()` — silencia o loop de 403 em qualquer tela que reaproveite esse select (Extratos, Estornos, Créditos, Cadastrar Associado etc.), não só Meu Extrato.

**Também observado, não é bug**: a URL da tela é `/estratosMeus` (não `/extratosMeus`) — mas é consistente em **todas** as rotas de extrato (`/estratos`, `/estratosMeus`, `/estratosEstorno`) e na própria pasta `pages/estratos/`. É um "erre" trocado desde antes desta sessão, espalhado por convenção interna (rotas + nome de pasta), não uma inconsistência pontual — não quebra nada, é só estética. Renomear exigiria tocar rotas, pasta e imports em vários arquivos; não fiz por ser puramente cosmético e fora do que foi pedido — perguntar ao usuário se vale a pena antes de fazer.

**Validado**: Docker + Playwright real — filtro de Comprador reduz a lista corretamente, modal mostra Vendedor/Comprador nas linhas que têm transação associada (linhas de crédito puro legitimamente não têm, `transacao: null`), zero chamadas a `GET /agencias` como Associado.

## [RESOLVIDO 2026-08-21] "Gerar PDF" em Estornos nunca gerava PDF nenhum

Pedido pelo usuário junto com os filtros de Estorno (item acima). Achado: "Gerar PDF" nunca funcionou em lugar nenhum do sistema — não é regressão desta sessão. `ExtratosSearch.jsx` (compartilhado com a tela Extratos) tem `handleclick = () => navigate("/transacoesCadastrar")` — o botão só navega pra "Nova Transação", não gera nada. Mesmo padrão quebrado em `ContasSearch.jsx` e `SearchfieldExtrato.jsx`. O único componente de PDF que existe no projeto, `PDFVoucher.jsx`, também está quebrado (campos de `state.user` que não existem mais, ex: `state.user.usuario.dadosGerais`) e nem chama `html2canvas` de fato — só importa a lib sem usar.

**O que mudou:** `ExtratosSearch.jsx` ganhou uma prop opcional `onGerarPdf` — quando informada (só em `ExtratosEstorno.jsx`), o botão chama essa função em vez de navegar; sem ela, mantém o comportamento antigo (não quebra as outras telas que reaproveitam o componente). Novo `exportEstornosPdf.js` (usa `jspdf` + `jspdf-autotable`, dependência nova) gera um PDF paisagem com Código/Data/Solicitante/Tipo/Valor/Comprador/Vendedor/Agência/Motivo/Status — pedido explícito do usuário por um "relatório mais completo", não só as colunas visíveis na tela. `estorno.service.ts`'s `include` ganhou `agencia: {nome}` aninhado em comprador/vendedor/contaOrigem/contaDestino pra ter o nome pronto (antes só tinha `agenciaId`).

Como `ExtratosSearch.jsx` não tem acesso ao `getFilteredRowModel()` de `ExtratosTable.jsx` (componentes irmãos, não pai/filho), o PDF respeita os filtros ativos via `estornoFilters.js` — replica os mesmos predicados de `constantsEstorno.js` rodando direto sobre o array de solicitações antes de gerar o PDF. **Se os filtros da tabela mudarem, esse arquivo precisa ser atualizado junto** (comentário no próprio arquivo já avisa).

**Também corrigido, achado ao vivo**: "Meu Extrato" (`MeusExtratos.jsx`) tem o mesmo `ExtratosSearch.jsx` sem `onGerarPdf` — usuário clicou em "Gerar PDF" ali e caiu em "Nova Transação" com erros de 403 no console (`GET /agencias`, endpoint `superadmin`-only, chamado por quem estava logado como Agência). Mesmo fix aplicado: `onGerarPdf` + novo `exportMeuExtratoPdf.js`. De quebra, `constantsMeuExtrato.js` ganhou as colunas ocultas de Período (`dataInicio`/`dataTermino`), que também não filtravam nada.

**Fora de escopo, ainda quebrado**: "Gerar PDF" em `Extratos.jsx` (usa o mesmo `ExtratosSearch.jsx` sem passar `onGerarPdf`), `ContasSearch.jsx`, `SearchfieldExtrato.jsx`, e `PDFVoucher.jsx` continuam com o mesmo bug. Em "Meu Extrato" os filtros de Associado/Agência/Comprador/Vendedor de `ExtratosSearch.jsx` continuam decorativos — não fazem sentido nesse contexto (é sempre a própria conta) e não foram implementados; só Período foi ligado.

**Validado**: Docker + Playwright real — download do PDF capturado e conferido campo a campo (via leitura do PDF gerado) nas duas telas (Estornos e Meu Extrato).

## [RESOLVIDO 2026-08-20] Filtros de Estornos (Associado/Agência/Comprador/Vendedor) não filtravam nada

Pedido pelo usuário: reconferir os filtros da tela de Estornos. `ExtratosSearch.jsx` é compartilhado com a tela "Extratos" (já corrigida antes nesta sessão), mas `constantsEstorno.js` não tinha nenhuma coluna com `id` batendo os nomes desses filtros — mesmo padrão de bug já visto antes (filtro no form, sem coluna oculta pra receber o `columnFilters`).

**O que mudou:** `estorno.service.ts`'s `include` ganhou `id` em comprador/vendedor e `contaOrigem`/`contaDestino` (agenciaId) — mesmos dados já usados em `relatorioPermutas`. `constantsEstorno.js` ganhou 4 colunas ocultas (`comprador`, `vendedor`, `agencia`, `associado` — mesmos `filterIncludes`/`filterIncludesId` já usados em `constantsTransacoes.js`), e `ExtratosTable.jsx` escondeu os headers novos.

**Validado**: Docker + Playwright real — Comprador/Vendedor/Agência filtram corretamente a lista.

## [RESOLVIDO 2026-08-20] Faltava botão "Negar" pra Matriz em Estornos, e aprovar/negar não registrava motivo

Reportado pelo usuário depois de aprovar um estorno de verdade em produção: "não vi a opção de negar e informar o por que foi negado". Dois problemas achados:

1. **`ExtratosTable.jsx` não tinha o botão "Negar" pra Matriz** — só "Aprovar". `TransacoesTable.jsx` e `VoucherTable.jsx` (as outras duas tabelas que usam o mesmo componente `Buttons` pro fluxo de estorno) já tinham os dois botões — `ExtratosTable.jsx` ficou pra trás. `Buttons.jsx` já tinha toda a lógica de `type="Reject"` pronta (ícone, handler, chamada de `negarRefound`), só não era renderizada nessa tabela. Corrigido: adicionado o mesmo bloco de botão que as outras duas tabelas já tinham.

2. **Aprovar/negar não pedia justificativa nenhuma** — `SolicitacaoEstorno` só guardava o motivo de quem pediu, nunca a resposta da Matriz. Adicionado campo `respostaMatriz` (migration `20260820232020_add_resposta_matriz_estorno_credito`, nullable no banco — solicitações antigas já resolvidas não têm esse dado — obrigatório na aplicação via Zod, mínimo 10 caracteres). Novo modal `DecisaoEstornoModal.jsx` pede o motivo tanto pra aprovar quanto pra negar, substituindo o popup de confirmar/cancelar simples nos botões Aprovar/Negar (mesmo padrão do `SolicitarEstornoModal.jsx` já usado ao pedir o estorno).

**Aplicado também em Crédito** (`SolicitacaoCredito`, mesmo padrão em_analise→encaminhado→aprovado/negado) por pedido explícito do usuário, pra manter os dois fluxos consistentes — `PATCH /creditos/:id/aprovar`/`/negar` agora também exigem `respostaMatriz`.

**Validado**: via curl (422 com a mensagem certa quando falta `respostaMatriz`, tanto em estorno quanto em crédito) e Docker + Playwright real (modal de decisão bloqueia submit vazio, aprovação com motivo grava certinho no banco).

## [RESOLVIDO 2026-08-20] Front de Crédito inteiro quebrado (nomes de campo legados, endpoints inexistentes)

Achado ao aplicar `respostaMatriz` em Crédito (item acima): `CreditosModal.jsx` (usado por `CreditoAprovar.jsx`/`CreditoAnalise.jsx`/`CreditoMeus.jsx`/`Credito.jsx`) nunca funcionou — usava nomes de campo que não existem na API atual (`data.idSolicitacaoCredito`, `data.usuarioSolicitante.nome`, `data.usuarioCriador.nome`, `data.descricaoSolicitante`; real é `id`, `associado.nome`, `associado.agencia.nome`, `descricao`), e a checagem de "é meu próprio pedido" comparava o id da solicitação com o id do usuário logado (`data.idSolicitacaoCredito === getId()`) — nunca batia com nada. Além disso, cada página que alimenta a tabela também tinha bug próprio:

- `CreditoAprovar.jsx` buscava `creditosAnalise.solicitacoesEmAnalise`/`creditosAprovar.solicitacoesEmAnalise` (campos inexistentes — a resposta paginada é `{data: [...], meta}`) e chamava as duas queries (Agência + Matriz) sem checar o role de quem estava logado, tomando 403 numa delas sempre.
- `CreditoAnalise.jsx` buscava `data.solicitacoesDosFilhos` (idem).
- `Credito.jsx` buscava `data.todasSolicitacoes` (idem).
- `CreditoMeus.jsx` chamava `GET /creditos/listar/:id`, rota que **nunca existiu** — sempre 404. A rota real é `GET /creditos/meus`.
- `CreditoSolicitar.jsx` dava `POST /creditos/solicitar` (rota inexistente — real é `POST /creditos`) e mandava o campo `descricaoSolicitante` (schema espera `descricao`).

**O que mudou:** reescrito o fluxo inteiro (mesmo padrão já usado pra "Meus Dados" e pro fluxo de Estorno nesta sessão) — `CreditosModal.jsx` com os campos certos, checagem de posse via `associadoId` vs `entityId` do usuário logado, botão "Encaminhar" restrito a `isAgencia()` (antes era `!isMatriz()`, que incluía Associado incorretamente), textarea de `respostaMatriz` obrigatória pra Aprovar/Negar (botões desabilitados até preencher). Novos hooks `useQueryCreditosMeus`/`useQueryCreditosTodos`; `useQueryCreditosAnalisar`/`useQueryCreditosAprovar` ganharam `enabled` pra não disparar a query errada pro role errado. `CreditoSolicitar.jsx` corrigido pra rota/campo certos.

**Validado**: fluxo completo via Docker + Playwright real — Associado solicita → aparece em "Meus Créditos" → Agência encaminha → aparece na fila da Matriz → Matriz aprova com motivo (botão bloqueado sem motivo) → `movimentacao_conta` gerada e saldo incrementado corretamente, `respostaMatriz` gravado.

**Fora de escopo, ainda pendente**: `SearchfieldCredito.jsx` é puramente decorativo — nenhum campo é conectado a filtro real (`CreditosTable.jsx` não lê `filters.table` como `ExtratosTable.jsx` faz), e o select de Status tem `value`s completamente trocados (`"Serviço"`/`"Produto"` em vez dos status reais). Não bloqueia a listagem/aprovação (que já funciona), mas pesquisar/filtrar créditos não faz nada.

## [RESOLVIDO 2026-08-20] Login quebrava em produção depois de todo deploy (nginx com IP da API em cache)

Reportado: depois de um deploy, `POST /api/v1/auth/login` retornava `502 Bad Gateway` em produção, mesmo a API tendo subido normal (logs confirmam migrations/seed/"Starting API..." ok). Log do nginx: `connect() failed (113: Host is unreachable) while connecting to upstream ... upstream: "http://10.0.1.59:3000/..."`.

**Causa raiz:** `front/nginx.conf` tinha `proxy_pass http://api:3000/api/;` — um `proxy_pass` com string literal faz o nginx resolver o hostname `api` **uma única vez**, no startup do worker, e cachear o IP resolvido pra sempre (comportamento documentado do nginx, não é bug do nginx). Quando o container da API é recriado no deploy (Docker atribui um IP novo na rede interna), o container do frontend não é necessariamente recriado junto — ele continua rodando com o IP antigo em cache, e todo request pra `/api/*` cai num IP que não existe mais.

**O que mudou:** `resolver 127.0.0.11 valid=10s;` (DNS embutido do Docker) + `proxy_pass` usando variável (`set $api_upstream api:3000; proxy_pass http://$api_upstream;`) — isso força o nginx a re-resolver `api` a cada 10s em vez de cachear pra sempre, então ele acompanha o IP novo automaticamente sem precisar reiniciar o frontend a cada deploy da API.

**Cuidado ao mexer aqui de novo:** `proxy_pass` com variável **desativa a reescrita automática de prefixo de URI** do nginx — colocar uma URI depois da variável (`proxy_pass $var/api/;`) faz o path virar sempre literalmente `/api/`, quebrando toda rota (foi tentado e corrigido nesta mesma sessão, confirmado via teste local: request pra `/api/v1/auth/me` chegava na API como `/api/` puro, 404). A forma correta é `proxy_pass http://$var;` **sem URI**, deixando o nginx repassar o path original intacto.

**Mitigação imediata em produção** (antes do deploy do fix chegar): `docker restart <container-do-frontend>` — força o nginx a resolver `api` de novo com o IP atual, sem precisar mexer na API.

**Validado**: local via Docker — path forwarding correto (`/api/v1/auth/me` chega intacto na API) e a API foi recriada (`--force-recreate`) sem o frontend precisar reiniciar, continuando a rotear certo.

## [RESOLVIDO 2026-08-20] Estorno de associado sem Agência ficava invisível pra Matriz pra sempre

Reportado via screenshot: Matriz logada, tela "Estornos" vazia, mesmo com uma solicitação existindo. Investigado: `GET /estornos/matriz` só mostrava status `encaminhado`/`aprovado`/`negado` — uma solicitação em `em_analise` nunca aparecia, mesmo o backend (`finalizar()`) já aceitando aprovar direto de `em_analise`, e o front (`ExtratosTable.jsx`) já tendo os botões Aprovar/Negar prontos pra esse status. Perguntei ao usuário se a solicitação específica já tinha sido encaminhada pela Agência — resposta: não, porque **o associado foi cadastrado direto pela Matriz, sem Agência no meio** — confirmado que quando existe Agência, o fluxo tem que passar por ela normalmente, mas quando não existe, não tem quem encaminhar e a solicitação ficava travada em `em_analise` pra sempre, invisível pra todo mundo.

**O que mudou:** `estorno.service.ts::listarMatriz` e `credito.service.ts::listarCreditosMatriz` (mesmo padrão, mesma classe de bug) passam a incluir `em_analise` na fila da Matriz **só quando não existe Agência envolvida** — no estorno, checa se comprador/vendedor (Associado) e contaOrigem/contaDestino não pertencem a nenhuma Agência; no crédito, checa `associado.agenciaId === null`. Quando existe Agência, `em_analise` continua invisível pra Matriz até alguém encaminhar (comportamento correto, confirmado pelo usuário).

**Validado**: via curl real — solicitação de associado sem Agência (`Visual Test`) apareceu na fila da Matriz e foi aprovada com sucesso (transação virou `estornada`); solicitação de associado COM Agência (`Associado Filtro Teste`) continuou de fora da fila, como esperado.

## [RESOLVIDO 2026-08-20] Transação com estorno solicitado continuava mostrando só "concluida", sem nenhum indício

Reportado via screenshot: usuário solicitou estorno de uma transação em "Transações Minhas" e o Status continuou "concluida", sem qualquer sinal de que havia uma solicitação em andamento. Comportamento é por design — `transacao.status` só vira `estornada` quando a Matriz efetivamente aprova (correto: a transação continua válida até a reversão de fato acontecer) — mas a solicitação pendente não aparecia em lugar nenhum da UI, deixando a mudança de status "invisível" pro usuário que acabou de pedir o estorno.

**O que mudou:** `transaction.service.ts` (`list`/`getById`) e `report.service.ts` (`extrato`/`relatorioPermutas`) passam a incluir a última `SolicitacaoEstorno` de cada transação (`solicitacoesEstorno`, `take: 1`, mais recente primeiro). Novo helper `statusTransacao.jsx` (`StatusTransacaoCell`/`StatusTransacaoRelationCell`) renderiza um badge abaixo do status normal quando há solicitação `em_analise`/`encaminhado`/`negado` (não mostra pra `aprovado`, já redundante com `status: 'estornada'`). Aplicado nas 4 tabelas que mostram status de transação: Transações Minhas, Transações (Agência/Matriz), Meu Extrato, Extratos.

**Validado** com Docker + Playwright real: transação com solicitação `em_analise` mostra "Concluída" + badge "Estorno em análise" em Transações Minhas.

## [RESOLVIDO 2026-08-20] Solicitar estorno não pedia o motivo

Pedido pelo usuário: reconferir a lógica de Estorno. Duas checagens: (1) aprovação sempre pela Matriz mesmo com Agência intermediando — já estava correto (`PATCH /estornos/:id/aprovar` e `/negar` são `superadmin`-only; Agência só encaminha via `/encaminhar`, nunca aprova). (2) motivo obrigatório na solicitação, pra Matriz ter o que analisar — **não estava**: `motivo` era opcional no schema (`z.string().optional()`) e o front nunca coletava nada, sempre mandava `{transacaoId}` sem motivo (botão "Solicitar Estorno" era um popup de confirmar/cancelar simples).

**O que mudou:** `SolicitarEstornoSchema.motivo` virou obrigatório (`min(10)`, mesmo padrão de `offer.schema.ts`). Novo modal `SolicitarEstornoModal.jsx` (textarea obrigatória) substitui o popup de confirmação simples no botão "Solicitar Estorno" (usado em Meu Extrato/Transações/Cancelar Voucher, mesmo componente `Buttons.jsx` tipo `Undo`). Coluna `motivo` no banco continua nullable (linhas antigas já tinham `motivo` nulo — não fazia sentido migração NOT NULL só por causa da validação de entrada, que já é suficiente na borda).

**Validado**: via curl direto (motivo ausente/curto → 422 com a mensagem certa; motivo válido → segue pro 404 esperado de transação inexistente), via Docker + Playwright real (modal abre, bloqueia submit vazio, sucesso grava o motivo real no banco), e reconfirmado que `agency_admin` recebe 403 em `/aprovar`/`/negar`.

## [RESOLVIDO 2026-08-20] `PATCH /estornos/:id/encaminhar` e `PATCH /creditos/:id/encaminhar` sem checagem de posse (IDOR)

Pedido pelo usuário: revisão da lógica de Estorno pra ver se estava de acordo com o desenhado. Fluxo de dinheiro (`transaction.service.ts::estorno` — reversão atômica, ledger imutável, checagem de saldo, restauração de quantidade da oferta, geração de voucher) confere com o spec e está correto. Achado no processo: **`encaminhar` não checava se a solicitação era da própria agência do `agency_admin` que chamava** — qualquer `agency_admin` conseguia encaminhar (avançar de `em_analise` pra `encaminhado`) uma solicitação de estorno **ou de crédito** de qualquer outra agência, bastando adivinhar/enumerar o `id`, e a resposta ainda vazava dados da transação/associado de outro tenant. Mesma classe de bug já corrigida em `user.service.ts` nesta sessão (`POST /usuarios` e afins) — aqui não tinha sido aplicada.

**O que mudou:** `estorno.service.ts::encaminhar` e `credito.service.ts::encaminharCredito` agora recebem o `requester` (`role`, `entityId`, e `contaId` no caso de estorno, pra cobrir Agência participando direto da transação) e checam posse antes de avançar o status — `agency_admin` só encaminha o que é da própria agência (via `comprador.agenciaId`/`vendedor.agenciaId`/`contaOrigemId`/`contaDestinoId` no estorno; via `associado.agenciaId` no crédito); fora disso, `404` (não `403`, pra não confirmar a existência do id pra quem não tem acesso). `superadmin` continua encaminhando qualquer uma. `aprovar`/`negar` já eram `superadmin`-only nos dois fluxos, sem gap de tenant.

**Validado:** `tsc --noEmit` limpo, suite de testes (18/18) sem regressão. Validação end-to-end com Docker real (cross-tenant `agency_admin` tentando encaminhar solicitação de outra agência) ficou pendente — porta 3000 estava ocupada por outro processo (`autohubs/nfs-e`, projeto não relacionado, não foi encerrado) no momento do fix; revisão de código + tipos + testes deram cobertura suficiente pra confiança na correção, mas recomenda-se validar live assim que a porta estiver livre.

## [RESOLVIDO 2026-08-17] "Meus Dados" (`UsuariosDados.jsx`) sempre em branco e editável sem necessidade

Reportado via screenshot em produção: usuário Matriz abria "Meus Dados" e quase todos os campos vinham vazios (Razão Social, CNPJ, Contato, Endereço etc.), e a seção final ("Nome"/"Cpf"/"E-mail") era editável de verdade, com botão "Atualizar" fazendo `PUT`, quando a página deveria ser só visualização.

**Causa raiz (dados em branco):** a página lia tudo de `state.user`, populado só pelo snapshot enxuto de `GET /auth/me` (`{id,nome,email,role,entityType,entityId,entityName,conta}`) — nunca teve razão social, CNPJ, endereço etc. Além disso o formulário foi originalmente montado no shape do model `Associado` (`descricao`, `restricao`, `mostrarNoSite`, `tipoOperacao`, `categoriaId` — tudo exclusivo de Associado), então mesmo corrigindo a fonte de dados, Agência nunca teria esses campos (não existem no model `Agencia`), e **Matriz não é uma entidade no banco** — é só `entityType: 'matriz'` numa `Conta`, sem linha própria, então campos institucionais nunca terão dado ali.

**O que mudou:**
- Página virou 100% somente-leitura: removido o `<form>`/`onSubmit`/`updateUser`, o upload de imagem e o botão "Atualizar". Todo input é `readOnly`/sem `name`.
- Novos endpoints self-scoped (`request.user.entityId`, mesmo padrão do `/extrato`): `GET /associados/me` (roles `associate_admin`/`associate_operator`/`gerente`) e `GET /agencias/me` (`agency_admin`/`agency_operator`) — reaproveitam os `getById` já existentes.
- Matriz: sem entidade própria, mostra só o que existe de fato (Nome Fantasia + Limite de Crédito, via `/auth/me`).
- Agência: mostra os campos reais do model `Agencia`; os que não existem no model (`descricao`, `restricao`, `mostrarNoSite`, `tipoOperacao`, `aceitaOrcamento`/`aceitaVoucher`, `categoriaId`) ficam sempre em branco por decisão explícita — não são inventados nem escondidos, só não têm onde buscar dado (decisão do usuário: manter os campos no form, mesmo sempre vazios pra Agência).
- Associado tinha o mesmo bug de dados em branco (mesma causa raiz do `/auth/me` enxuto) — corrigido do mesmo jeito, agora busca via `/associados/me`.
- `GET /auth/me` ganhou `cpf` no `select` (usado na seção "Dados do usuário").
- Dois bugs de guard pré-existentes achados no processo (mesmo padrão dos já registrados nesta sessão — rota liberada só pra admin, nunca pra quem só visualiza): `GET /planos` (`plan.routes.ts`) não incluía `associate_admin`/`associate_operator`/`gerente`/`agency_operator`, então o "Plano de Inscrição" nunca resolvia pra Associado; corrigido com um guard `readRoles` dedicado (mantendo `POST`/`PUT`/`PATCH` restritos a `superadmin`).

**Achado, não corrigido (fora de escopo — afeta outras telas):** `PlanosOptions.jsx` renderiza `<option value={JSON.stringify(plano)}>`, não `value={plano.id}` — qualquer `<select>` que tente pré-selecionar um plano via `defaultValue={planoId}` (como o próprio `PlanosFields.jsx`, usado em `CadastrarAgencia`, `EditarAgenciaModal`, `EditarAssociadoModal`, `GerentesCadastrar`) nunca bate o `value` do `<option>` e sempre cai em "Selecione", mesmo com o plano certo já cadastrado. Nesta página o problema foi contornado lendo o plano direto de `entidade.plano` (já vem incluído no `GET /associados/me`/`GET /agencias/me`) em vez de reusar `PlanosFields`; os outros 4 call sites continuam com o bug.

Validado com Postgres real via Docker + Playwright, 3 papéis (Matriz/Agência/Associado): campos com dado real no banco aparecem corretos (incluindo Plano de Inscrição e Percentual de Comissão, antes sempre vazios); campos sem correspondência no model ficam em branco como esperado; nenhum papel mostra mais o botão "Atualizar".

## [RESOLVIDO 2026-08-17] `ExtratosSearch.jsx` — filtros de Associado/Agência/Comprador/Vendedor não filtravam nada em Extratos
~~Filtros de texto/seleção escreviam em `filters.table`, mas nenhuma coluna casava com essas chaves; campo Associado nem tinha `onChange` nem opções.~~ Corrigido: `constantsTransacoes.js` ganhou `id`/`filterFn` explícitos pra Comprador/Vendedor (substring case-insensitive) e duas colunas ocultas — `agencia`/`associado` — cujo `accessorFn` produz a lista de ids relevantes da linha (agência que gerencia comprador/vendedor, ou a própria agência quando ela é parte direta via `contaOrigem`/`contaDestino`; id de comprador/vendedor). Filtro client-side, sobre a página já carregada (mesmo padrão do filtro de Período).

No caminho, mais 2 bugs pré-existentes descobertos e corrigidos: `useQueryAgencias.js` não desembrulhava o envelope da API (`res.data` era `{success, data}`, não o array — afetava também o seletor de Agência no cadastro de Associado, fora do escopo desta tela); `GET /associados/diretorio` só aceitava roles de Associado — abriu pra Agência/Matriz também (`report.service.ts::relatorioPermutas` ganhou `include` de `agenciaId` do comprador/vendedor/contaOrigem/contaDestino pra sustentar o filtro de Agência).

Validado com Postgres real: Comprador/Vendedor (texto), Agência e Associado (seleção) todos filtram corretamente sobre um cenário com agência+associado gerido reais.

## [RESOLVIDO 2026-08-21] Constraints de domínio aplicadas via seed.ts, não via migration formal
~~`saldo_nao_negativo`, `valor_rt_positivo` e demais `CHECK` constraints são aplicadas via `$executeRaw` idempotente dentro de `api/prisma/seed.ts`~~ — movidas pra migration formal `20260821220119_constraints_e_sequence_formais` (`prisma migrate dev --create-only` + SQL manual, guardas `IF NOT EXISTS` mantidas pra idempotência em ambientes que já tinham). Também movida a `CREATE SEQUENCE conta_numero_seq` (usada por `gerarNumeroConta()` em toda criação de Agência/Associado/Matriz) — estava no mesmo risco e nem tinha sido citada antes como constraint, mas é tão crítica quanto (sem ela, nenhuma conta nova pode ser criada).

**Validado**: `prisma migrate deploy` contra um Postgres **novo** (container descartável, nunca rodou seed) aplicou as 12 migrations e criou a sequence + as 5 constraints sozinho — confirmado via `\dS+ conta_numero_seq` e `pg_constraint`. `seed.ts` continua rodando sem erro (idempotente) no banco que já tinha essas constraints do jeito antigo.

## Imagem de produção da API carrega `devDependencies` inteiras
`api/Dockerfile` tem um estágio `base` (`npm ci --only=production`) que nunca é usado — o estágio `production` copia `node_modules` do `builder`, que instalou tudo (`npm ci` completo). Isso acontece porque `prisma` e `tsx` (usados em runtime pelo `entrypoint.sh` para `migrate deploy`/seed) estão em `devDependencies`.
**Ação futura:** mover `prisma` e `tsx` para `dependencies` e ajustar o Dockerfile para copiar `node_modules` do estágio `base` — reduz tamanho de imagem e superfície de CVE. Precisa validar que o Prisma Client gerado no `builder` continua acessível (ver onde `prisma generate` grava o client) antes de trocar a origem do `node_modules`.

## [RESOLVIDO 2026-08-21] Seed roda em todo boot do container (idempotente, mas não ideal)
~~`entrypoint.sh` executa `prisma/seed.ts` a cada start/restart do container `api`, não só na primeira vez.~~ Corrigido: `entrypoint.sh` só roda o seed quando `RUN_SEED=true`. `docker-compose.yml` (local/dev) seta `RUN_SEED: "true"` sempre, pra manter o fluxo de teste desta sessão sem mudança. `docker-compose.prod.yml` deixa `RUN_SEED` default `false` — pra rodar o seed uma vez em produção (primeiro deploy, ou reaplicar categorias padrão), sobe com `RUN_SEED=true docker compose -f docker-compose.prod.yml up -d api` uma vez e depois volta a subir sem a variável.

**Ordem importa**: só foi seguro desacoplar o seed do boot **depois** de mover a sequence/constraints pra migration formal (item acima) — senão um ambiente novo que nunca rodasse o seed manualmente ficaria sem `conta_numero_seq` e sem as CHECK constraints indefinidamente.

**Validado**: container local com `RUN_SEED=true` roda o seed (log "Running database seed..."); container de teste descartável sem a variável mostra "Skipping seed (RUN_SEED not set to true)." e sobe normalmente.

## [RESOLVIDO 2026-08-14] `limiteVendaMensal`/`limiteVendaTotal` limitavam o comprador, não o vendedor
~~Os campos se chamam "limite de **venda**", mas `validarLimiteVenda` agregava débitos da conta do **comprador**~~ — herdado do antigo `plano.limiteRT`, que também limitava o comprador. Decisão de produto tomada: **o campo agora limita de fato quem vende** (agrega créditos — RT recebido — na conta de quem está vendendo), não quem compra. Quem compra já é limitado por `saldo` + `limiteCredito` (checagem própria, com CHECK constraint no banco); um teto de volume adicional do lado do comprador era redundante com isso. Do lado do vendedor não existia nenhum freio — vender é só crédito na conta — e é isso que o negócio quer limitar (evitar que um membro flood a economia de RT vendendo desproporcionalmente).

**O que mudou:** `validarLimiteVenda` (`limites.ts`) agrega `tipo: 'credito'` em vez de `tipo: 'debito'`. `permuta()`/`negociada()` (`transaction.service.ts`) passam a chamar essa validação com a conta do **vendedor** (resolvendo `limiteVendaMensal`/`Total` do vendedor por `entityType`, mesma regra de null pra Agência já estabelecida), não mais do comprador. `relatorioUsoPlanoConta` (`report.service.ts`) também passou a agregar crédito, pra ficar consistente. Validado com Postgres real: comprador com `limiteVendaMensal` baixíssimo consegue comprar normalmente (só saldo/crédito importam); venda que estouraria o limite mensal do vendedor é bloqueada; acumulado entre `permuta` e `negociada` do mesmo vendedor soma corretamente no mesmo mês.

## [RESOLVIDO 2026-08-21] Cobertura de teste parcial em `limites.ts`
Só `saldoSuficienteParaDebito` (função pura) tinha teste automatizado. `getLimiteCreditoDaConta` e `validarLimiteVenda` (as duas funções que tocam banco) não tinham cobertura.

**O que mudou:** `limites.test.ts` — em vez de injeção de dependência (mudaria a assinatura das duas funções só pra testar), usou-se `vi.mock('../../config/prisma.js')` com `vi.fn()` nos dois métodos realmente chamados (`conta.findUnique`, `movimentacaoConta.aggregate`), a mesma técnica já usada no arquivo pro mock de `Errors`. Cobre: `getLimiteCreditoDaConta` com limite presente, `null` (vira zero) e conta inexistente (vira zero); `validarLimiteVenda` dentro dos dois limites, estourando só o mensal, estourando só o total (mesmo dentro do mensal), agregados nulos (conta sem movimentação ainda) e o caso de borda exatamente no teto (permite, não bloqueia).

**Validado:** `npx tsc --noEmit` limpo; `npm test` 26/26 (18 → 26, as 8 novas cobrindo os dois branches faltantes).

## [RESOLVIDO] Corte de "mês corrente" em `validarLimiteVenda` usa timezone do servidor
Entrada desatualizada — já tinha sido corrigido numa sessão anterior (commit `f7cfee1`, antes desta entrada de tech-debt.md ser escrita) e nunca foi marcado aqui. `inicioMesBrasilia()` calcula o corte via UTC explícito (offset fixo -3h, Brasil não tem horário de verão desde 2019), não depende do timezone do container. 4 testes cobrindo meio do mês, os 3 minutos antes/depois da virada em Brasília, e virada de ano — `limites.test.ts`.

## `TASK.md` desatualizado após a migração de limiteRT do plano pra limiteVendaMensal/Total
`api/docs/TASK.md` ainda lista como concluído "Validar limite RT do plano antes de criar oferta" e "Validar limite mensal do plano" — ambos descrevem comportamento retirado por essa branch (ver `SPEC.md` §9, já atualizado). `TASK.md` é checklist histórico de construção, baixo risco, mas vale sincronizar numa próxima passada de limpeza de docs.

## `negociada()` só generaliza o lado comprador — Agência/Matriz não conseguem vender por negociação direta
`negociadaSchema.vendedorId` continua exigindo um `Associado.id` — a compra/venda por Agência e Matriz (Task 9, ver `AJUSTES.md` 2026-08-13) generalizou o **comprador** de `permuta()`/`negociada()` e o dono de `Oferta`, mas não o **vendedor** de `negociada()`. Agência/Matriz só conseguem vender via `Oferta` (marketplace), não por negociação direta sem oferta.
**Ação futura:** se o negócio precisar, `negociadaSchema.vendedorId` precisa aceitar um `contaId` genérico, com ajuste correspondente no front (hoje o "diretório de associados" só lista Associados).

## Sem tela de front pra Agência/Matriz cadastrar oferta ou comprar
A API de Ofertas/Transações está pronta e validada end-to-end (curl + Postgres real, ver `task-9-report.md`) para Agência e Matriz como compradoras/donas de oferta — mas não existe nenhuma tela no front que use isso. Front é rodada separada, fora do escopo desta branch.

## [RESOLVIDO 2026-08-14] `estorno.service.ts`/`report.service.ts` filtravam só por `compradorId`/`vendedorId`, ignorando compra/venda de Agência e Matriz
~~Ambos os módulos filtravam transações só por `compradorId`/`vendedorId` — FK só de `Associado`, ficam `null` quando quem compra/vende é Agência ou Matriz.~~ Corrigido: `relatorioPermutas`/`relatorioComissoes` (`report.service.ts`) e `solicitarEstorno`/`listarFilhas` (`estorno.service.ts`) passam a considerar também `contaOrigemId`/`contaDestinoId` — a agência (ou Matriz) participando diretamente de uma transação (via Oferta) agora aparece nos relatórios e no fluxo de estorno da própria agência, além dos associados que ela já gerenciava. Validado com Postgres real: Agência comprando de Associado agora aparece em `/relatorios/permutas`, `/relatorios/comissoes` (comissão calculada corretamente) e `/estornos/filhos`.

## [RESOLVIDO 2026-08-14] Agência sem `planoId` vinculado compra com comissão 0%, silenciosamente
~~Quando a Agência compradora não tinha `planoId` preenchido, `permuta()`/`negociada()` calculavam `comissaoBRL = 0` sem erro nem log.~~ Decisão de produto tomada: `planoId` vira **obrigatório** na criação de Agência, igual já era pra Associado — não dá mais pra esse estado existir a partir de agora.

**O que mudou:** `Agencia.planoId` (schema Prisma + migration `20260814230000_agencia_planoid_obrigatorio`) passa de opcional pra obrigatório; `createAgencySchema` exige `planoId`; `PlanosFields` no formulário de cadastro de Agência (`CadastrarAgencia.jsx`) deixou de ser `optional` (o front já tinha o campo, só não era exigido). Atualização de Agência existente (`updateAgencySchema`) continua com `planoId` opcional — não força reescolher o plano a cada edição.

**Risco de migração:** a migration `SET NOT NULL` falha de propósito se existir Agência com `planoId` nulo — sem backfill automático, sem plano arbitrário atribuído por conta própria. Ambiente resetado nesta sessão pra validar (`docker compose down -v` + `up`), então não houve dado a preservar. Se algum dia isso rodar contra um banco com Agências reais sem plano, é preciso atribuir manualmente antes.

## Lógica de resolução do comprador duplicada entre `permuta()` e `negociada()`
O branch por `entityType` da conta compradora (resolver Associado/Agência/Matriz, comissão, limites — ~27 linhas) está duplicado entre `permuta()` e `negociada()` em `transaction.service.ts`. Aceito nesta rodada (ruling do controlador do processo durante as revisões das Tasks 1-8) porque as duas funções têm nuances próprias (uma envolve oferta e decremento de estoque, a outra não) e a duplicação ainda é pequena o bastante pra não compensar o risco de uma abstração prematura.
**Ação futura:** se essa lógica crescer, ou um terceiro ponto de entrada financeiro similar aparecer, extrair um helper compartilhado (ex: `resolverCompradorParaCompra(contaId)`).

## [RESOLVIDO 2026-08-21] Checagem de saldo em `permuta()`/`negociada()`/`transferencia()` acontece fora da transação Prisma
Mesmo padrão pré-existente (não é regressão desta rodada) — a validação de `saldoSuficienteParaDebito` roda antes do `prisma.$transaction` nos 3 pontos de entrada financeiros (`transaction.service.ts`), então duas operações concorrentes da mesma conta podem ambas passar a validação de aplicação; só a `CHECK` constraint do banco (`saldo_acima_limite_credito`) barra a segunda. Achado e registrado durante a revisão das Tasks 1-8.

**Decisão:** mapear o erro de constraint do banco pra uma resposta HTTP amigável (opção de baixo risco), em vez de mover a checagem pra dentro da transação com lock explícito (refactor maior do padrão fetch→valida→muta em `permuta()`/`negociada()`/`transferencia()`, fora do escopo "rápido, baixo risco" da Fase 1) — a corrida em si continua existindo (é rara e o CHECK do banco já garante que o saldo nunca fica inconsistente), só deixou de virar 500 genérico.

**O que mudou:** `api/src/app.ts` — `setErrorHandler` global ganhou um bloco antes da checagem de `ZodError` que faz duck-typing no formato real do erro (`@prisma/adapter-pg` embrulha violação de `CHECK` constraint como `DriverAdapterError` com `error.cause = { code: '23514', message: '...constraint "nome_da_constraint"...' }` — não é um `PrismaClientKnownRequestError` com código `P20xx`, confirmado empiricamente contra o Postgres real do Docker, já que o Prisma não modela `CHECK` constraints). Se `cause.code === '23514'` e a mensagem menciona `saldo_acima_limite_credito`, responde `422 INSUFFICIENT_BALANCE` (mesmo formato que `Errors.insufficientBalance()` já usa nos outros pontos); qualquer outra violação de `CHECK` (`valor_rt_positivo`, `quantidade_nao_negativa`, etc.) responde `422 CONSTRAINT_VIOLATION` genérico em vez de vazar mensagem de erro do Postgres com 500.

**Validado:** `npx tsc --noEmit` limpo; `npm test` 18/18; contra a API real em Docker — script isolado provocou a violação real do `CHECK` direto no Postgres pra capturar o formato exato do erro (`DriverAdapterError`/`cause.code`/`cause.message`), depois `app.inject()` numa rota de teste temporária (removida após o teste) confirmou os dois branches: violação de `saldo_acima_limite_credito` → `422 INSUFFICIENT_BALANCE`; violação de outra constraint (`valor_rt_positivo`) → `422 CONSTRAINT_VIOLATION`.

## [RESOLVIDO 2026-08-14] `GET /auth/me` retornava `conta: null` pra Matriz
Desde a Task 1 (2026-08-13) o JWT da Matriz já carregava um `contaId` real, mas `/auth/me` (`auth.service.ts`) não tinha sido atualizado pra resolver e retornar essa conta — só existiam branches pra `associado`/`agencia`. Corrigido: `me()` ganhou o terceiro branch (`entityType === 'matriz'`), buscando a `Conta` por `entityType` (mesmo padrão do `login()`) e retornando `{ id, numero, saldo, limiteCredito }` real. Validado com Postgres real — Matriz e Associado confirmados sem regressão.

## Runbook de deploy da migration `20260814190919_oferta_conta_generica`
Migration da Task 3 (compra/venda por Agência e Matriz) que torna `oferta.contaId` genérico (dono pode ser Associado, Agência ou Matriz) e faz `oferta.associadoId` virar opcional. **Antes de aplicar em produção**, rodar essa checagem de sanidade do backfill:
```sql
SELECT count(*) FROM oferta o LEFT JOIN conta c ON c."associadoId" = o."associadoId" WHERE c.id IS NULL;
```
Tem que dar **0** — se não der, o `UPDATE` de backfill (que popula `oferta.contaId` a partir de `conta.associadoId`) vai deixar linhas com `contaId` nulo, e o `ALTER COLUMN "contaId" SET NOT NULL` subsequente falha, travando o deploy.

Além disso, a migration segura locks em `oferta` **e** em `conta` (a tabela financeira mais usada do sistema) até o commit — o Prisma envolve o arquivo inteiro numa transação, então `ALTER COLUMN ... SET NOT NULL`, `ADD CONSTRAINT ... FOREIGN KEY` e `CREATE INDEX` (sem `CONCURRENTLY`) seguram esses locks o tempo todo, bloqueando escritas concorrentes em `conta` durante a aplicação. Se `oferta` crescer muito antes do deploy real acontecer, vale considerar rodar em janela de baixo tráfego.

## [RESOLVIDO 2026-08-14] `POST /usuarios` aceitava `entityType`/`entityId` do corpo sem checar posse

Achado na revisão final da branch de compra/venda por Agência e Matriz (2026-08-14) — vulnerabilidade pré-existente, não introduzida por essa branch, mas amplificada por ela (JWT forjado passava a permitir gastar saldo/RT da agência-vítima via `/transacoes/permuta`/`/negociada`). Corrigido em sessão separada: o módulo inteiro de usuários (`user.schema.ts`/`user.service.ts`/`user.controller.ts`) foi revisado — não só `create()`, mas também `getById`/`update`/`changePassword`/`setStatus`/`remove`, que também não filtravam por posse.

**O que mudou:** `createUserSchema` não aceita mais `entityId`/`entityType` do body — sempre derivados de `request.user`, com checagem de compatibilidade `role`×`entityType` (agência só cria `agency_*`, associado só cria `associate_*`). Todas as funções que operam por `id` (`getById`/`update`/`setStatus`/`remove`) passam a exigir `mesmoTenant(requester, target)` (mesma Agência/Associado, ou `superadmin`) — `404` em vez de `403` quando não bate, pra não confirmar a existência do id pra quem não tem acesso. `changePassword` ficou estritamente self-only (`id === requester.id`), já que exige `senhaAtual`.

**Validado** com dois tenants reais (Agência Vítima + Agência Atacante) via Postgres/Redis Docker: exploit original bloqueado (usuário criado fica no tenant do atacante, não no da vítima informado no body); `GET`/`PUT`/`PATCH status`/`DELETE` cross-tenant retornam 404; troca de senha de outro usuário (mesmo tenant) retorna 403; `role` incompatível retorna 403; `superadmin` mantém acesso irrestrito (bypass intencional); fluxos legítimos (mesmo tenant, self-service de senha) continuam 200.

## [RESOLVIDO 2026-08-14] `transaction.service.ts` `getById()` não filtrava por posse

~~Achado na revisão final da branch de compra/venda por Agência e Matriz (2026-08-14) — qualquer `associate_operator`+ autenticado conseguia ler qualquer transação por id.~~ Corrigido junto com o item acima na mesma sessão de hardening — ver commit que adiciona filtro `OR: [{ contaOrigemId: contaId }, { contaDestinoId: contaId }]` em `getById`, mesmo padrão que `list()` já aplicava.

## [Alto — PARCIALMENTE RESOLVIDO 2026-08-14] Matriz emitindo RT via `permuta()`/`negociada()` sem rastreio contábil equivalente ao de `credito()`

Achado na revisão final da branch de compra/venda por Agência e Matriz — interação entre a Task 1 (Matriz ganhou `Conta` real com `limiteCredito` altíssimo fixo, "sem limite na prática") e a Task 7 (guard de `/transacoes/permuta`/`/negociada` abriu pra `superadmin`). Um `superadmin` "comprando" como Matriz cria RT novo levando o saldo da Matriz a negativo — exatamente como o fluxo já existente `credito()`, mas gravado como `tipo: 'permuta'`/`'negociada'`.

**Parte resolvida:** `limiteCredito` da Matriz deixou de ser um valor mágico só no seed — agora é editável via `PATCH /matriz/limite-credito` (`superadmin`-only, módulo novo `api/src/modules/matriz/`), dando visibilidade/auditabilidade operacional sobre o teto, mesmo que o valor continue alto na prática.

**Parte ainda pendente (decisão de produto):** essas transações continuam gravadas como `tipo: 'permuta'`/`'negociada'`, fora do relatório de emissão que hoje só olha `tipo: 'credito'`. Como o `report.service.ts` agora já enxerga a Matriz normalmente em `relatorioPermutas`/`relatorioComissoes` (ver item de filtros acima, resolvido junto), a visibilidade básica já existe — falta decidir se vale a pena um relatório dedicado de "emissão via compra" separado do relatório de permutas comum, ou se basta a visão já disponível.

## [RESOLVIDO 2026-08-14] Visibilidade pós-compra de Agência/Matriz

Consolidação de achados já registrados separadamente. Era: Agência gastava RT normalmente, mas não conseguia ver a própria transação em relatório, no fluxo de estorno, nem via `GET /transacoes*`/`avaliar` (guard dessas duas últimas era Associado-only).

**O que mudou:** relatórios (`relatorioPermutas`/`relatorioComissoes`), estorno (`solicitarEstorno`/`listarFilhas`) e agora também `GET /transacoes`, `GET /transacoes/:id` e `PATCH /transacoes/:id/avaliar` (guard `transaction.routes.ts` trocado de `operator`, Associado-only, pra `comprador`, que já incluía `agency_admin`/`agency_operator`/`superadmin`) mostram/permitem a participação direta da Agência/Matriz. Decisão de baixo risco: `list()`/`getById()` já filtravam por `contaOrigemId`/`contaDestinoId` (fix de segurança desta sessão), e `avaliar()` já checava `usuarioIniciadorId` por usuário, não por role — abrir o guard não exigiu nenhuma mudança de lógica de autorização, só ampliar quem pode chegar até ela.

Validado com Postgres real: Agência vê a própria transação em `GET /transacoes`/`GET /transacoes/:id`, avalia a compra que ela mesma fez; outra Agência (não participante) recebe 404 em `getById` e 403 em `avaliar`; Associado sem regressão.
