import { MongoClient } from 'mongodb'
import { MangoDbContext } from '../mangoDbContext'
import { MangoRepo } from '../mangoRepo'

describe('MangoDbContext', () => {
  interface User {
    id: string
    name: string
  }

  class DbContext extends MangoDbContext {
    collectionNames = {
      users: 'users',
      games: 'games',
    }

    async initializeDbData() {}

    users = new MangoRepo<User>(this.db, this.collectionNames.users)

    games = new MangoRepo<User>(this.db, this.collectionNames.games, {
      idTransformation: false,
    })
  }

  let client: MongoClient
  let db: DbContext

  beforeAll(async () => {
    client = await await new MongoClient(
      'mongodb://localhost:27017/mango-test',
    ).connect()

    db = new DbContext(client.db())

    await db.createCollections()
  })

  afterAll(async () => {
    await db.dropCollections()

    await client.close(true)
  })

  it('should create game and user', async () => {
    const user = await db.users.create({ name: 'User 1' })
    expect(user).toBeTruthy()
    expect(user.name).toBe('User 1')

    const game = await db.games.create({
      id: 'game.mygame1',
      name: 'Game 1',
    })
    expect(game).toBeTruthy()
    expect(game.id).toBe('game.mygame1')
  })
})
