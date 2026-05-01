# PROMPT MASTER — Rede Trade API

Cole este prompt no Claude Code para iniciar a construção completa da API.

---

## Prompt

```
Você é responsável por construir a API completa da Rede Trade.

Antes de escrever qualquer código, leia por completo:
- docs/ARCHITECTURE.md
- docs/SPEC.md
- docs/SCHEMA.md
- docs/TASKS.md

Siga estas regras durante toda a execução:

1. PROGRESSO: O arquivo docs/TASKS.md é sua fonte de verdade de progresso.
   - Antes de iniciar cada tarefa, marque-a como `[~]` (em andamento).
   - Ao concluir, marque como `[x]`.
   - Se algo bloquear, marque como `[!]` e descreva o problema na coluna Observações.
   - Atualize a tabela "Progresso Geral" ao concluir cada etapa inteira.

2. ORDEM: Execute as etapas na ordem do TASKS.md. Não pule etapas.

3. ATOMICIDADE: Toda operação financeira deve usar `prisma.$transaction`.
   Nunca deixar estado parcial no banco.

4. IMUTABILIDADE: As tabelas `movimentacao_conta` e `comissao_gerente`
   nunca recebem UPDATE ou DELETE. Apenas INSERT.

5. SEGURANÇA: Todo endpoint (exceto os marcados como público no SPEC.md)
   deve passar pelo AuthGuard e RoleGuard antes de chegar no controller.

6. DOCUMENTAÇÃO HTTP: Ao finalizar cada módulo, crie o arquivo
   docs/http/[modulo].http com todos os endpoints daquele módulo.
   Ao final de tudo, consolide tudo em docs/http/doc.http com variáveis
   @baseUrl e @token no topo.

7. PADRÃO DE RESPOSTA: Siga exatamente o padrão definido em
   ARCHITECTURE.md §12 para todas as respostas (sucesso e erro).

8. CONTEXTO ENTRE SESSÕES: Se esta sessão for interrompida, na próxima
   sessão releia o TASKS.md para saber exatamente onde parar e continue
   a partir da primeira tarefa com status `[ ]` ou `[~]`.

Agora inicie pela ETAPA 1 do TASKS.md e avance continuamente até
a ETAPA 18, atualizando o TASKS.md a cada tarefa concluída.
```
