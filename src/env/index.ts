import { z } from 'zod'

// Defina o esquema de validação das variáveis de ambiente
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3333'),
  DATABASE_URL: z.string().url(),
})

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  console.error('🚧 Invalid environment variables', _env.error.format())
  throw new Error('Invalid environment variables')
}

export const env = _env.data
