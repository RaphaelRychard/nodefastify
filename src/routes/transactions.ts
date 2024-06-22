import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prismaClient } from '../database/prismaClient'
import { randomUUID } from 'crypto'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const transactions = await prismaClient.transactionClinte.findMany()

    return { transactions }
  })

  app.get('/:uuid', async (request) => {
    const getTransactionParamsSchema = z.object({
      uuid: z.string().uuid(),
    })

    const { uuid } = getTransactionParamsSchema.parse(request.params)

    const transaction = await prismaClient.transactionClinte.findUnique({
      where: { uuid },
    })

    return { transaction }
  })

  app.get('/summary', async () => {
    const summaryResult = await prismaClient.transactionClinte.aggregate({
      _sum: {
        amount: true,
      },
    })

    const summary = { amount: summaryResult._sum.amount }

    return { summary }
  })

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
