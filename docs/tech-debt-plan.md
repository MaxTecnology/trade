# Plano de resolução de débito técnico

> Backlog organizado em 2026-08-21 a partir de `docs/tech-debt.md` (itens não
> resolvidos) + 3 itens ainda válidos achados em `docs/implementation-plan.md`
> (sessão de 2026-07-01). Cada item concluído é marcado aqui **e** ganha (ou
> atualiza) uma entrada `[RESOLVIDO]` em `docs/tech-debt.md` com o que mudou
> e como foi validado.

## Fase 1 — rápidos, baixo risco, sem decisão pendente

- [x] `TASK.md` desatualizado (limiteRT do plano → limiteVendaMensal/Total)
- [x] Seed rodando em todo restart do container → rodar só uma vez
- [x] Constraints de integridade (`CHECK`) via migration formal em vez de `seed.ts`
- [x] Timezone do servidor no corte de "mês corrente" (`validarLimiteVenda`)
- [x] Checagem de saldo fora da transação Prisma → erro amigável (`INSUFFICIENT_BALANCE`)
- [x] Cobertura de teste em `limites.ts` (`getLimiteCreditoDaConta`/`validarLimiteVenda`)
- [x] `Agencia.create()` não retorna a `conta` recém-criada (Associado retorna, Agência não)

## Fase 2 — infra, precisa mais cuidado na validação

- [x] Imagem Docker da API carregando `devDependencies` em produção

## Fase 3 — precisa decisão de produto antes de codar

- [x] `Cobranca` ganha campo `tipo` (`inscricao | manutencao | comissao | outro`) — base pro item abaixo e pro relatório de emissão
- [x] Manutenção anual do plano — reaproveita módulo de Cobrança, 100% manual (gerar/quitar/bloquear), com relatório de acompanhamento (`GET /cobrancas/manutencao-anual`)
- [ ] Relatório de emissão da Matriz (`GET /relatorios/emissao-matriz`) — desenho já validado com o usuário (circulação atual, injeção direta, crédito aprovado, queima, compra da Matriz), falta implementar

## Fase 4 — investigação/feature maior, cada uma com conversa de escopo própria

- [ ] Módulo Cobranças/`ContasModal.jsx` — mesmo padrão de campos legados
      quebrados já corrigido em Créditos/Usuários; não auditado a fundo ainda.
- [ ] `negociada()` aceitar Agência/Matriz como vendedor (hoje só Associado)
- [ ] Tela de front pra Agência/Matriz cadastrar oferta ou comprar (API pronta)
- [ ] Índice único parcial pra impedir duas `SolicitacaoEstorno` simultâneas
      pra mesma transação (hoje só checado na aplicação)

## Fora do plano ativo

- Duplicação de lógica de resolução do comprador entre `permuta()`/`negociada()`
  — decisão já tomada de deixar como está (pequeno demais pra abstrair).
