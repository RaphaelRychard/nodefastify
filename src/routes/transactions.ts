import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prismaClient } from '../database/prismaClient'
import { randomUUID } from 'crypto'

export async function transactionsRoutes(app: FastifyInstance) {
  app.post('/', async (request, replay) => {
    const createTransactionBodySchema = z.object({
      title: z.string().default('not title'),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    await prismaClient.transactionClinte.create({
      data: {
        uuid: randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        type,
      },
    })

    return replay.status(201).send()
  })
}
