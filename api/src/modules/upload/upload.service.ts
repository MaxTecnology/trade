import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { b2Client, B2_BUCKET } from '../../config/b2.js'
import { env } from '../../config/env.js'
import { prisma } from '../../config/prisma.js'
import { Errors } from '../../shared/errors/AppError.js'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function uploadArquivo(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  tamanho: number,
) {
  if (!ALLOWED_MIME.includes(mimeType)) {
    throw new (await import('../../shared/errors/AppError.js')).AppError(
      'VALIDATION_ERROR',
      'Tipo de arquivo não permitido. Use JPEG, PNG, WEBP ou GIF.',
      400,
    )
  }
  if (tamanho > MAX_SIZE_BYTES) {
    throw new (await import('../../shared/errors/AppError.js')).AppError(
      'VALIDATION_ERROR',
      'Arquivo muito grande. Tamanho máximo: 5 MB.',
      400,
    )
  }

  const ext = originalName.split('.').pop() ?? 'jpg'
  const key = `uploads/${randomUUID()}.${ext}`

  await b2Client.send(
    new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read',
    }),
  )

  const url = `${env.B2_PUBLIC_URL}/${key}`

  const arquivo = await prisma.arquivo.create({
    data: { nome: originalName, url, tamanho, mimeType, bucket: B2_BUCKET },
  })

  return arquivo
}

export async function deletarArquivo(id: string) {
  const arquivo = await prisma.arquivo.findUnique({ where: { id } })
  if (!arquivo) throw Errors.notFound('Arquivo')

  const key = arquivo.url.replace(`${env.B2_PUBLIC_URL}/`, '')
  await b2Client.send(new DeleteObjectCommand({ Bucket: B2_BUCKET, Key: key }))
  await prisma.arquivo.delete({ where: { id } })
}
