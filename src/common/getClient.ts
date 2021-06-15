import { MongoClient } from 'mongodb'

export async function getClient(
  connectionString: string,
  poolSize = 20,
) {
  const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize,
  })

  return client.connect()
}
