# Padrões de Entidade: Associado e Agência

## Visão Geral

Ambas as entidades seguem o mesmo padrão de criação: uma entidade principal com sub-modelos para contato e uma `Conta RT` criada automaticamente no momento do cadastro.

---

## Padrão Associado

### Modelos Prisma envolvidos
- `Associado` — entidade principal
- `ContatoAssociado` — contato secundário (1:N, mas usamos só o primeiro)
- `Conta` — conta RT criada automaticamente (`entityType: 'associado'`)
- `Usuario` — usuário de acesso criado com `role: 'associate_admin'`
- `Plano` — plano de inscrição (`tipoPlano: 'associado'`)

### Campos do Associado
| Campo | Tipo | Obs |
|---|---|---|
| nome | String | Razão Social |
| nomeFantasia | String? | Nome da loja |
| cnpj | String @unique | |
| email | String @unique | Email de login |
| tipoAtendimento | TipoAtendimento[] | presencial, online, voucher |
| tipoOperacao | TipoOperacao? | compra, venda, compra_venda |
| planoId | String | FK obrigatória |
| categoriaId | String? | FK opcional |
| agenciaId | String? | FK opcional |
| gerenteId | String? | FK para Usuario (gerente) |
| imagemUrl | String? | URL da imagem na bucket B2 |
| limiteCredito | Decimal? | |
| limiteVendaMensal | Decimal? | |
| limiteVendaTotal | Decimal? | |
| diaVencimentoFatura | Int? | |
| logradouro … regiao | String? | Campos de endereço |

### Campos do ContatoAssociado
| Campo | Tipo |
|---|---|
| nomeContato | String? |
| celular | String? |
| emailContato | String? |
| emailSecundario | String? |
| site | String? |

### Fluxo de criação (`POST /associados`)
1. Valida CNPJ/email únicos, plano ativo de tipo `associado`, gerente e agência existentes
2. Cria `Associado` com todos os campos
3. Se houver campos de contato → cria `ContatoAssociado`
4. Gera número de conta e cria `Conta RT` (`entityType: 'associado'`)
5. Cria `Usuario` (`role: 'associate_admin'`) com email = email do associado
6. Se `valorInscricaoBRL > 0` → cria `Cobranca` BRL
7. Se `valorInscricaoRT > 0` → cria `MovimentacaoConta` (débito) e atualiza saldo negativo
8. Se `gerenteId` e plano tem `taxaInscricaoRT > 0` → cria `ComissaoGerente` (inscrição)

### Fluxo de atualização (`PUT /associados/:id`)
1. Extrai campos de contato (`nomeContato`, `celular`, etc.) do payload
2. Atualiza `Associado` com os campos restantes
3. Se houver campos de contato → cria ou atualiza o `ContatoAssociado` existente

### Endpoints
```
POST   /associados              → cria (agency_admin ou superadmin)
GET    /associados              → lista (agency_admin vê só os seus)
GET    /associados/:id          → detalhe
PUT    /associados/:id          → editar
PATCH  /associados/:id/status   → bloquear/ativar (ativo | suspenso | inativo)
PATCH  /associados/:id/loja     → status da loja (aberta | fechada | pausada)
GET    /associados/:id/conta    → conta RT
```

### Upload de imagem
- Endpoint: `POST /upload` (multipart/form-data, campo `file`)
- Retorna `{ success: true, data: { url, id } }`
- O `imagemUrl` deve ser enviado no payload do associado/agência
- **Não definir** `Content-Type` manualmente no axios — o boundary é definido automaticamente

---

## Padrão Agência

### Modelos Prisma envolvidos
- `Agencia` — entidade principal
- `ContatoAgencia` — contato secundário (1:N, usamos só o primeiro)
- `Conta` — conta RT criada automaticamente (`entityType: 'agencia'`)
- `Usuario` — criado como `agency_admin` se `senha` + `usuarioEmail` forem fornecidos
- `Plano` — plano de inscrição (`tipoPlano: 'agencia'`)

### Campos da Agencia
| Campo | Tipo | Obs |
|---|---|---|
| nome | String | Razão Social |
| nomeFantasia | String? | |
| cnpj | String @unique | |
| tipo | TipoAgencia | master, comum |
| email | String @unique | Email da agência |
| planoId | String? | FK opcional |
| imagemUrl | String? | URL da imagem na bucket B2 |
| limiteCredito | Decimal? | |
| limiteVendaMensal | Decimal? | |
| limiteVendaTotal | Decimal? | |
| taxaRepasseMatriz | Decimal? | % repasse para a matriz |
| diaVencimentoFatura | Int? | |
| logradouro … regiao | String? | Campos de endereço |

### Campos do ContatoAgencia
| Campo | Tipo |
|---|---|
| nomeContato | String? |
| celular | String? |
| emailSecundario | String? |

### Fluxo de criação (`POST /agencias`)
1. Valida CNPJ/email únicos
2. Agência `comum` requer `agenciaParenteId`
3. Se `planoId` → valida plano ativo de tipo `agencia`
4. Cria `Agencia` com todos os campos
5. Se houver campos de contato → cria `ContatoAgencia`
6. Gera número de conta e cria `Conta RT` (`entityType: 'agencia'`)
7. Se `senha` + `usuarioEmail` fornecidos → cria `Usuario` (`role: 'agency_admin'`) para a nova agência
8. Caso contrário → atualiza o usuário criador (`agenciaId`)

### Fluxo de atualização (`PUT /agencias/:id`)
1. Extrai campos de contato e `endereco` do payload
2. Atualiza `Agencia` com os campos restantes + campos de endereço se presentes
3. Se houver campos de contato → cria ou atualiza `ContatoAgencia`

### Endpoints
```
POST   /agencias              → cria (superadmin ou agency_admin)
GET    /agencias              → lista (superadmin vê todas, agency_admin vê só a sua)
GET    /agencias/:id          → detalhe
PUT    /agencias/:id          → editar
PATCH  /agencias/:id/status   → bloquear/ativar (ativo | suspenso | inativo)
GET    /agencias/:id/associados → associados da agência
GET    /agencias/:id/gerentes   → gerentes da agência
GET    /agencias/:id/conta      → conta RT
```

---

## Diferenças entre os padrões

| Aspecto | Associado | Agência |
|---|---|---|
| Plano | Obrigatório | Opcional |
| tipoPlano | `'associado'` | `'agencia'` |
| Contato | `ContatoAssociado` (nomeContato, celular, emailContato, emailSecundario, site) | `ContatoAgencia` (nomeContato, celular, emailSecundario) |
| Usuário criado | Sempre, com email do próprio associado | Só se `senha` + `usuarioEmail` forem fornecidos |
| Cobrança BRL | Sim, se `valorInscricaoBRL > 0` | Não |
| Saldo RT negativo | Sim, se `valorInscricaoRT > 0` | Não |
| Comissão gerente | Sim, na inscrição | Não |

---

## Frontend — Formulário de Cadastro

### Campos de moeda (RealInput / CampoMoeda)
Armazenam valores no formato `"RT$ 1.234,56"`. Ao enviar ao backend, converter com:
```js
const parseMoney = (val) => {
    if (!val) return undefined
    const cleaned = String(val).replace(/[^0-9,]/g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? undefined : num
}
```

### Upload de imagem
```js
const imagemInput = event.target.querySelector('input[name="imagem"]')
const imagemFile = imagemInput?.files?.[0]
// NÃO usar useState para o arquivo — risco de stale closure
if (imagemFile) {
    const fd = new FormData()
    fd.append('file', imagemFile)
    const res = await api.post('upload', fd)  // sem Content-Type manual
    imagemUrl = res.data?.data?.url ?? res.data?.url
}
```

### PlanosFields
Componente que renderiza select de planos + campos de leitura (percentualComissao, etc.).
- `type="associado"` → filtra planos de tipo associado
- `type="agencia"` → filtra planos de tipo agência
- `optional` → remove `required` dos campos internos (para formulários onde o plano é opcional)
- `defaultValue={info}` → pré-seleciona o plano atual (usa `info.planoId`)
