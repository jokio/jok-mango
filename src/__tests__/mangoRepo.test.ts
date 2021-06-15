import getClient from '../common/getClient'
import { MangoRepo } from '../mangoRepo'

describe('mangoRepo', () => {
  describe('basic', () => {
    type User = {
      id: string
      nickname: string
    }

    it('should create new entry', async () => {
      const client = await getClient('')

      const repo = new MangoRepo<User>(client.db(), 'test')

      const nickname = 'ezeki'

      const result = await repo.insertOne({ nickname })

      expect(result).toBeTruthy()
      expect(result.id).toBeTruthy()
      expect(result.nickname).toBe(nickname)
    })
  })

  describe('feature: idMapping', () => {})

  describe('feature: idTransformation', () => {})

  describe('feature: idMapping with idTransformation', () => {})

  describe('feature: returnLatestDocumentByDefault', () => {})

  describe('feature: docVersioning', () => {})

  describe('feature: docDates', () => {})

  describe('feature: session (transaction)', () => {})

  describe('feature: logger', () => {})
})
