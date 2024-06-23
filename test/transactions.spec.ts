import { it, beforeAll, afterAll, describe, expect } from 'vitest'
import request from 'supertest'

import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('Transactoins toutes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeAll(() => {
    execSync('npx prisma migrate dev')
  })

  it('should be able to create a new transation', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    if (!cookies) {
      throw new Error('Cookie not found')
    }

    const listTransactionReponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionReponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New Transaction',
        amount: '5000',
        type: 'credit',
      }),
    ])
  })

  it('should be able to get a specific transacton', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    if (!cookies) {
      throw new Error('Cookie not found')
    }

    const listTransactionReponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionUuid = listTransactionReponse.body.transactions[0].uuid

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionUuid}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New Transaction',
        amount: '5000',
        type: 'credit',
      }),
    )
  })

  it('should be able to get the summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit Transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    if (!cookies) {
      throw new Error('Cookie not found')
    }

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 2000,
        type: 'debit',
      })

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      amount: '3000',
    })
  })
})
