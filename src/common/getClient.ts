import { MongoClient } from 'mongodb'

export default async function (connectionString) {
	const client = new MongoClient(connectionString, { useNewUrlParser: true })

	return client.connect()
}
