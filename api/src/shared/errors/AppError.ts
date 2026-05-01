export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INSUFFICIENT_BALANCE'
  | 'PLAN_LIMIT_REACHED'
  | 'DUPLICATE_CNPJ'
  | 'DUPLICATE_EMAIL'
  | 'MAX_USERS_REACHED'
  | 'OFFER_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'AGENCY_SUSPENDED'
  | 'ASSOCIATE_SUSPENDED'
  | 'ESTORNO_PRAZO_EXPIRADO'
  | 'LOJA_FECHADA'
  | 'GERENTE_INATIVO'
  | 'PLANO_INATIVO'
  | 'CATEGORIA_IN_USE'

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details: unknown[]

  constructor(code: ErrorCode, message: string, statusCode = 422, details: unknown[] = []) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export const Errors = {
  unauthorized: () => new AppError('UNAUTHORIZED', 'Token inválido ou expirado.', 401),
  forbidden: () => new AppError('FORBIDDEN', 'Sem permissão para esta operação.', 403),
  notFound: (resource = 'Recurso') =>
    new AppError('NOT_FOUND', `${resource} não encontrado.`, 404),
  insufficientBalance: () =>
    new AppError('INSUFFICIENT_BALANCE', 'Saldo insuficiente para realizar a operação.', 422),
  planLimitReached: () =>
    new AppError('PLAN_LIMIT_REACHED', 'Limite mensal do plano atingido.', 422),
  duplicateCnpj: () => new AppError('DUPLICATE_CNPJ', 'CNPJ já cadastrado no sistema.', 409),
  duplicateEmail: () => new AppError('DUPLICATE_EMAIL', 'E-mail já cadastrado no sistema.', 409),
  maxUsersReached: () =>
    new AppError('MAX_USERS_REACHED', 'Limite de usuários por associado atingido.', 422),
  offerUnavailable: () =>
    new AppError('OFFER_UNAVAILABLE', 'Oferta fechada ou sem quantidade disponível.', 422),
  validation: (details: unknown[] = []) =>
    new AppError('VALIDATION_ERROR', 'Erro de validação dos campos.', 400, details),
  internal: () => new AppError('INTERNAL_ERROR', 'Erro interno do servidor.', 500),
  invalidCredentials: () =>
    new AppError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos.', 401),
  accountLocked: () =>
    new AppError('ACCOUNT_LOCKED', 'Conta bloqueada. Tente novamente em 15 minutos.', 429),
  agencySuspended: () =>
    new AppError('AGENCY_SUSPENDED', 'Agência suspensa. Operação não permitida.', 422),
  associateSuspended: () =>
    new AppError('ASSOCIATE_SUSPENDED', 'Associado suspenso. Operação não permitida.', 422),
  estornoPrazoExpirado: () =>
    new AppError('ESTORNO_PRAZO_EXPIRADO', 'Estorno permitido apenas dentro de 30 dias.', 422),
  lojaFechada: () =>
    new AppError('LOJA_FECHADA', 'Loja fechada. Abra a loja para realizar esta operação.', 422),
  gerenteInativo: () =>
    new AppError('GERENTE_INATIVO', 'Gerente inativo não pode cadastrar associados.', 422),
  planoInativo: () =>
    new AppError('PLANO_INATIVO', 'Plano inativo não pode ser atribuído a novos associados.', 422),
  categoriaInUse: () =>
    new AppError(
      'CATEGORIA_IN_USE',
      'Categoria possui ofertas vinculadas e não pode ser excluída.',
      422,
    ),
}
