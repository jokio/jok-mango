import { Db, MongoClient, ObjectId } from 'mongodb'
import {
  MangoDocumentDates,
  MangoDocumentVersion,
  MangoRepo,
} from '../mangoRepo'

describe('mangoRepo', () => {
  let client: MongoClient
  let db: Db
  const collectionName = 'test'

  beforeAll(async () => {
    client = await new MongoClient(
      'mongodb://localhost:27017/mango-test',
    ).connect()

    db = client.db()

    await db.createCollection(collectionName)
  })

  afterAll(async () => {
    await db.dropCollection(collectionName)

    await client.close(true)
  })

  describe('basic', () => {
    type User = {
      id: string
      nickname: string
      zodiac?: string
      age?: number
    }

    it('should create new entry', async () => {
      const repo = new MangoRepo<User>(db, collectionName)

      const nickname = 'ezeki'

      const result = await repo.create({ nickname })

      expect(result).toBeTruthy()
      expect(result.id).toBeTruthy()
      expect(result.nickname).toBe(nickname)
    })

    it('should create many entries', async () => {
      const repo = new MangoRepo<User>(db, collectionName)

      const count = await repo.createMany([
        { nickname: 'u1' },
        { nickname: 'u2' },
      ])

      expect(count).toBe(2)
    })

    it('should update entry', async () => {
      const repo = new MangoRepo<User>(db, collectionName)

      const item = await repo.create({ nickname: 'EZ' })

      const updatedItem = await repo.updateOne(
        { nickname: 'EZ' },
        { $set: { zodiac: 'leo' } },
      )

      expect(updatedItem).toBeTruthy()
      expect(updatedItem!.nickname).toBe('EZ')
      expect(updatedItem!.zodiac).toBe('leo')

      const finalItem = await repo.updateOne(
        { id: item.id },
        { $inc: { age: 1 } },
      )

      expect(finalItem).toBeTruthy()
      expect(finalItem!.nickname).toBe('EZ')
      expect(finalItem!.zodiac).toBe('leo')
      expect(finalItem!.age).toBe(1)
    })

    it('should update many entries', async () => {
      const repo = new MangoRepo<User>(db, collectionName)

      const createdCount = await repo.createMany([
        { nickname: 'U1', age: 20 },
        { nickname: 'U2', age: 20 },
      ])

      const updatedCount = await repo.updateMany(
        { age: 20 },
        { $inc: { age: 1 } },
      )

      expect(createdCount).toBe(updatedCount)
      expect(updatedCount).toBe(2)
    })

    it('should delete many entries', async () => {
      const repo = new MangoRepo<User>(db, collectionName)

      const createdCount = await repo.createMany([
        { nickname: 'U1', age: 18 },
        { nickname: 'U2', age: 18 },
      ])

      const deletedCount = await repo.deleteMany({ age: 18 })

      expect(createdCount).toBe(deletedCount)
      expect(deletedCount).toBe(2)
    })

    it('should query documents count', async () => {
      const repo = new MangoRepo<User>(db, collectionName)

      const createdCount = await repo.createMany([
        { nickname: 'U1', age: 17 },
        { nickname: 'U2', age: 17 },
        { nickname: 'U3', age: 17 },
        { nickname: 'U3', age: 19 },
      ])

      const count17 = await repo.count({ age: 17 })
      const count19 = await repo.count({ age: 19 })
      const count20 = await repo.count({ age: 20 })

      expect(createdCount).toBe(4)
      expect(count17).toBe(3)
      expect(count19).toBe(1)
      expect(count20).toBe(0)
    })

    it('should query document by id', async () => {
      const repo = new MangoRepo<User>(db, collectionName)

      const item = await repo.create({
        nickname: 'RandomUserName',
        age: 5,
      })

      const queriedItem = await repo.getById(item.id)

      expect(queriedItem).toBeTruthy()
      expect(queriedItem?.id).toBe(item.id)
      expect(queriedItem?.nickname).toBe(item.nickname)
    })

    it('should query documents by filter', async () => {
      const repo = new MangoRepo<User>(db, collectionName)

      const createdCount = await repo.createMany([
        { nickname: 'U1', age: 31 },
        { nickname: 'U2', age: 31 },
        { nickname: 'U3', age: 31 },
        { nickname: 'U3', age: 30 },
      ])

      const count17 = await repo.count({ age: 17 })
      const count19 = await repo.count({ age: 19 })
      const count20 = await repo.count({ age: 20 })

      expect(createdCount).toBe(4)
      expect(count17).toBe(3)
      expect(count19).toBe(1)
      expect(count20).toBe(0)
    })

    it('should query documents by _id filter (complex)', async () => {
      const repo = new MangoRepo<User>(db, collectionName)

      const id1 = new ObjectId().toHexString()
      const id2 = new ObjectId().toHexString()

      const createdCount = await repo.createMany([
        { id: id1, nickname: 'U1', age: 31 },
        { id: id2, nickname: 'U2', age: 31 },
        { nickname: 'U3', age: 31 },
        { nickname: 'U3', age: 30 },
      ])

      const count1 = await repo.count({ id: { $in: [id1] } })
      const count2 = await repo.count({ id: { $in: [id1, id2] } })

      expect(createdCount).toBe(4)
      expect(count1).toBe(1)
      expect(count2).toBe(2)
    })
  })

  describe('feature: idMapping', () => {
    type User = {
      id: string
      name: string
      zodiac?: string
      age?: number
    }

    let repo: MangoRepo<User>

    beforeAll(() => {
      repo = new MangoRepo<User>(db, collectionName, {
        idMapping: true,
        idTransformation: false,
      })
    })

    it('should do the id mapping to _id and back on create', async () => {
      const name = 'ezeki'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()
      expect(item.id).toBeTruthy()
      expect(typeof item.id).toBe('object')
    })

    it('should do the id mapping to _id and back on update', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const updatedItem = await repo.updateOne(
        { id: item.id },
        { $set: { age: 100 } },
      )
      expect(updatedItem).toBeTruthy()
      expect(updatedItem?.id).toBeTruthy()
      expect(typeof updatedItem?.id).toBe('object')
    })

    it('should do the id mapping to _id and back on getById', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const updatedItem = await repo.getById(item.id)
      expect(updatedItem).toBeTruthy()
      expect(updatedItem?.id).toBeTruthy()
      expect(typeof updatedItem?.id).toBe('object')
    })

    it('should do the id mapping to _id and back on query', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const updatedItems = await repo.query({ id: item.id })
      expect(updatedItems).toBeTruthy()
      expect(updatedItems).toHaveLength(1)
      expect(typeof updatedItems[0]?.id).toBe('object')
    })

    it('should do the id mapping to _id and back on count', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const count = await repo.count({ id: item.id })
      expect(count).toBe(1)
    })
  })

  describe('feature: idTransformation', () => {
    type User = {
      _id: string
      name: string
      zodiac?: string
      age?: number
    }

    let repo: MangoRepo<User>

    beforeAll(() => {
      repo = new MangoRepo<User>(db, collectionName, {
        idMapping: false,
        idTransformation: true,
      })
    })

    it('should do the _id transformation to ObjectId on create', async () => {
      const name = 'ezeki'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()
      expect(item._id).toBeTruthy()
      expect(typeof item._id).toBe('string')
    })

    it('should do the _id transformation to ObjectId and back to string on update', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const updatedItem = await repo.updateOne(
        { _id: item._id },
        { $set: { age: 100 } },
      )
      expect(updatedItem).toBeTruthy()
      expect(updatedItem?._id).toBeTruthy()
      expect(typeof updatedItem?._id).toBe('string')
    })

    it('should do the _id transformation to ObjectId and back to string on getById', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const updatedItem = await repo.getById(item._id)
      expect(updatedItem).toBeTruthy()
      expect(updatedItem?._id).toBeTruthy()
      expect(typeof updatedItem?._id).toBe('string')
    })

    it('should do the _id transformation to ObjectId and back to string on query', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const updatedItems = await repo.query({ _id: item._id })
      expect(updatedItems).toBeTruthy()
      expect(updatedItems).toHaveLength(1)
      expect(typeof updatedItems[0]?._id).toBe('string')
    })

    it('should do the _id transformation to ObjectId and back to string on count', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const count = await repo.count({ _id: item._id })
      expect(count).toBe(1)
    })
  })

  describe('feature: idMapping with idTransformation', () => {
    type User = {
      id: string
      name: string
      zodiac?: string
      age?: number
    }

    let repo: MangoRepo<User>

    beforeAll(() => {
      repo = new MangoRepo<User>(db, collectionName, {
        idMapping: true,
        idTransformation: true,
      })
    })

    it('should do the id transformation to ObjectId on create', async () => {
      const name = 'ezeki'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()
      expect(item.id).toBeTruthy()
      expect(typeof item.id).toBe('string')
    })

    it('should do the id transformation to ObjectId and back to string on update', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const updatedItem = await repo.updateOne(
        { id: item.id },
        { $set: { age: 100 } },
      )
      expect(updatedItem).toBeTruthy()
      expect(updatedItem?.id).toBeTruthy()
      expect(typeof updatedItem?.id).toBe('string')
    })

    it('should do the id transformation to ObjectId and back to string on getById', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const updatedItem = await repo.getById(item.id)
      expect(updatedItem).toBeTruthy()
      expect(updatedItem?.id).toBeTruthy()
      expect(typeof updatedItem?.id).toBe('string')
    })

    it('should do the id transformation to ObjectId and back to string on query', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const updatedItems = await repo.query({ id: item.id })
      expect(updatedItems).toBeTruthy()
      expect(updatedItems).toHaveLength(1)
      expect(typeof updatedItems[0]?.id).toBe('string')
    })

    it('should do the id transformation to ObjectId and back to string on count', async () => {
      const name = 'babt'

      const item = await repo.create({ name })
      expect(item).toBeTruthy()

      const count = await repo.count({ id: item.id })
      expect(count).toBe(1)
    })
  })

  describe('feature: returnLatestDocumentByDefault', () => {
    type User = {
      _id: string
      name: string
      zodiac?: string
      age?: number
    }

    it('should return the original document after update', async () => {
      const repo = new MangoRepo<User>(db, collectionName, {
        returnLatestDocumentByDefault: false,
      })

      await repo.create({ name: 'test1', age: 10 })

      const result = await repo.updateOne(
        { name: 'test1' },
        { $set: { name: 'test2' } },
      )
      expect(result).toBeTruthy()
      expect(result?.name).toBe('test1')
    })

    it('should return the updated document after update', async () => {
      const repo = new MangoRepo<User>(db, collectionName, {
        returnLatestDocumentByDefault: true,
      })

      await repo.create({ name: 'test1', age: 10 })

      const result = await repo.updateOne(
        { name: 'test1' },
        { $set: { name: 'test2' } },
      )
      expect(result).toBeTruthy()
      expect(result?.name).toBe('test2')
    })
  })

  describe('feature: docVersioning', () => {
    type User = MangoDocumentVersion & {
      id: string
      name: string
      tag?: string
      zodiac?: string
      age?: number
    }

    let repo: MangoRepo<User>

    beforeAll(() => {
      repo = new MangoRepo<User>(db, collectionName, {
        docVersioning: true,
      })
    })

    it('should set version on create', async () => {
      const item = await repo.create({ name: 'versionItem' })
      expect(item).toBeTruthy()
      expect(item.version).toBe(1)
    })

    it('should inc version on updateOne & updateMany', async () => {
      const item = await repo.create({ name: 'versionSecondItem' })
      expect(item).toBeTruthy()
      expect(item.version).toBe(1)

      const updatedItem = await repo.updateOne(
        { id: item.id },
        { $set: { name: 'VersionedTest', tag: 'test' } },
      )
      expect(updatedItem).toBeTruthy()
      expect(updatedItem!.version).toBe(2)

      const count = await repo.updateMany(
        { tag: 'test' },
        { $set: { tag: 'Test' } },
      )
      expect(count).toBe(1)

      const finalItem = await repo.getById(item.id)

      expect(finalItem).toBeTruthy()
      expect(finalItem?.version).toBe(3)
    })
  })

  describe('feature: docDates', () => {
    type User = MangoDocumentDates & {
      id: string
      name: string
      tag?: string
      zodiac?: string
      age?: number
    }

    let repo: MangoRepo<User>

    beforeAll(() => {
      repo = new MangoRepo<User>(db, collectionName, {
        docDates: true,
      })
    })

    it('should set createdAt on create', async () => {
      const item = await repo.create({ name: 'versionItem' })
      expect(item).toBeTruthy()
      expect(item.createdAt).toBeDefined()
      expect(item.updatedAt).toBeUndefined()
    })

    it('should not change createdAt and set updatedAt on updateOne & updateMany', async () => {
      const item = await repo.create({ name: 'versionItem' })
      expect(item).toBeTruthy()
      expect(item.createdAt).toBeDefined()
      expect(item.updatedAt).toBeUndefined()

      const updatedItem = await repo.updateOne(
        { id: item.id },
        { $set: { name: 'VersionedTest', tag: 'test' } },
      )
      expect(updatedItem).toBeTruthy()
      expect(updatedItem!.createdAt.getTime()).toBe(
        item.createdAt.getTime(),
      )
      expect(updatedItem!.updatedAt).toBeDefined()

      const count = await repo.updateMany(
        { tag: 'test' },
        { $set: { tag: 'Test' } },
      )
      expect(count).toBe(1)

      const finalItem = await repo.getById(item.id)

      expect(finalItem).toBeTruthy()
      expect(finalItem?.createdAt.getTime()).toBe(
        item.createdAt.getTime(),
      )
      expect(finalItem?.updatedAt).toBeDefined()
    })
  })

  describe('feature: session (transaction)', () => {
    // TODO: need tests
  })

  describe('feature: logger', () => {
    type User = MangoDocumentDates & {
      id: string
      name: string
      tag?: string
      zodiac?: string
      age?: number
      temp?: number
    }

    it('should log create call', done => {
      const repo = new MangoRepo<User>(db, collectionName, {
        logger: ({ collectionName: name, action }) => {
          expect(name).toBe(collectionName)
          expect(action).toBe('create')

          done()
        },
      })

      repo.create({ name: 'test1', age: 10 })
    })

    it('should log createMany call', done => {
      const repo = new MangoRepo<User>(db, collectionName, {
        logger: ({ collectionName: name, action }) => {
          expect(name).toBe(collectionName)
          expect(action).toBe('createMany')

          done()
        },
      })

      repo.createMany([{ name: 'test1', age: 10 }])
    })

    it('should log updateOne call', done => {
      const repo = new MangoRepo<User>(db, collectionName, {
        logger: ({ collectionName: name, action, filter }) => {
          expect(name).toBe(collectionName)
          expect(action).toBe('updateOne')
          expect(filter).toBeTruthy()

          done()
        },
      })

      repo.updateOne({}, { $inc: { temp: 1 } })
    })

    it('should log updateMany call', done => {
      const repo = new MangoRepo<User>(db, collectionName, {
        logger: ({ collectionName: name, action, filter }) => {
          expect(name).toBe(collectionName)
          expect(action).toBe('updateMany')
          expect(filter).toBeTruthy()

          done()
        },
      })

      repo.updateMany({}, { $inc: { temp: 1 } })
    })

    it('should log count call', done => {
      const repo = new MangoRepo<User>(db, collectionName, {
        logger: ({ collectionName: name, action, filter }) => {
          expect(name).toBe(collectionName)
          expect(action).toBe('count')
          expect(filter).toBeTruthy()

          done()
        },
      })

      repo.count({})
    })

    it('should log getById call', done => {
      const repo = new MangoRepo<User>(db, collectionName, {
        idTransformation: false,
        logger: ({ collectionName: name, action }) => {
          expect(name).toBe(collectionName)
          expect(action).toBe('getById')

          done()
        },
      })

      repo.getById('1')
    })

    it('should log query call', done => {
      const repo = new MangoRepo<User>(db, collectionName, {
        logger: ({ collectionName: name, action, filter }) => {
          expect(name).toBe(collectionName)
          expect(action).toBe('query')
          expect(filter).toBeTruthy()

          done()
        },
      })

      repo.query({})
    })

    it('should log deleteMany call', done => {
      const repo = new MangoRepo<User>(db, collectionName, {
        logger: ({ collectionName: name, action, filter }) => {
          expect(name).toBe(collectionName)
          expect(action).toBe('deleteMany')
          expect(filter).toBeTruthy()

          done()
        },
      })

      repo.deleteMany({})
    })
  })
})
