import 'dotenv/config'

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3000),
  API_PREFIX: process.env.API_PREFIX ?? '/api/v1',
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  B2_KEY_ID: process.env.B2_KEY_ID ?? '',
  B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY ?? '',
  B2_BUCKET_NAME: process.env.B2_BUCKET_NAME ?? 'redetrade',
  B2_ENDPOINT: process.env.B2_ENDPOINT ?? '',
  B2_REGION: process.env.B2_REGION ?? 'us-east-005',
  B2_PUBLIC_URL: process.env.B2_PUBLIC_URL ?? '',
}
