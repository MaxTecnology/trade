import type { FastifyRequest, FastifyReply } from 'fastify'
import { uploadArquivo, deletarArquivo } from './upload.service.js'
import { success } from '../../shared/utils/response.js'
import { AppError } from '../../shared/errors/AppError.js'

export async function uploadController(req: FastifyRequest, reply: FastifyReply) {
  const data = await req.file()
  if (!data) throw new AppError('VALIDATION_ERROR', 'Nenhum arquivo enviado.', 400)

  const buffer = await data.toBuffer()
  const arquivo = await uploadArquivo(
    buffer,
    data.filename,
    data.mimetype,
    buffer.byteLength,
  )

  return reply.status(201).send(success({ url: arquivo.url, id: arquivo.id }))
}

export async function deletarController(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string }
  await deletarArquivo(id)
  return reply.status(204).send()
}
