import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prismaClient } from '../database/prismaClient'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

// Unitários: unidade da sua aplicação
// Integração: cominicação entre duas ou mais unidades
// e2e - ponta a ponta: simulam um usuário operando na nossa aplicação

// front-end: abre a página de login, digite o texto diego@rockecetseat.com.br no campo com ID email, clique no botão
// back-end: chamadas HTTP, WebSckets

// Pirâmentes de testes: E2E (não dependem de nunhuma tecnologia, não dependerm de arquitetura)
// 2000 testes -> Teste E2E => 65min

export async function transactionsRoutes(app: FastifyInstance) {
  // isso faz com que execulte tudo nesse contexto sem afetar outros
  // app.addHook('preHandler', async (request, replay) => {
  //   console.log(`${request.method} ${request.url}`)
  // })

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const transactions = await prismaClient.transactionClinte.findMany({
        where: {
          sessoin_id: sessionId,
        },
      })

      return { transactions }
    },
  )

  app.get(
    '/:uuid',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getTransactionParamsSchema = z.object({
        uuid: z.string().uuid(),
      })

      const { uuid } = getTransactionParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const transaction = await prismaClient.transactionClinte.findUnique({
        where: {
          uuid,
          sessoin_id: sessionId,
        },
      })

      return { transaction }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const summaryResult = await prismaClient.transactionClinte.aggregate({
        where: {
          sessoin_id: sessionId,
        },
        _sum: {
          amount: true,
        },
      })

      const summary = { amount: summaryResult._sum.amount }

      return { summary }
    },
  )

  app.post('/', async (request, replay) => {
    const createTransactionBodySchema = z.object({
      title: z.string().default('not title'),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId
    if (!sessionId) {
      sessionId = randomUUID()

      replay.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await prismaClient.transactionClinte.create({
      data: {
        uuid: randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        type,
        created_at: Date(),
        sessoin_id: sessionId,
      },
    })

    return replay.status(201).send()
  })
}
