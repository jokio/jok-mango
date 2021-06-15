import { DocumentBase, getClient, getRepository } from './index'

const connectionString = process.env.MONGO_DB_CONNECTION

interface Item extends DocumentBase {
  name: string
  description?: string
}

async function run() {
  // connect client
  const client = await getClient(connectionString!)

  // get db
  const db = client.db()

  // create repository
  const collectionName = 'items'
  const items = getRepository<Item>(db, collectionName, {
    skipIdTransformations: true,
  })

  const item = await items.create({
    name: 'Ezeki',
  })

  // const item = await items.query(
  // 	{ id: '5c77f4ea1e40ca293af3fa72' },
  // )

  console.log('saved', item)
}

run()
