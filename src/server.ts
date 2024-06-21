import fastify from 'fastify'
import { prismaClient } from './database/prismaClient'

const app = fastify()

app.get('/hello', async () => {
  const createUser = await prismaClient.user.findMany()

  return createUser
})

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('HTTP Server Running')
  })
