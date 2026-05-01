export function success<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true, data, ...(meta ? { meta } : {}) }
}

export function paginated<T>(data: T[], page: number, limit: number, total: number) {
  return success(data, { page, limit, total, totalPages: Math.ceil(total / limit) })
}
