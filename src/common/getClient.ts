import { MongoClient } from 'mongodb'

export async function getClient(connectionString: string) {
  const client = new MongoClient(connectionString, {})

  return client.connect()
}
