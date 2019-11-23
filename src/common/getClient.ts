import { MongoClient } from 'mongodb'

export default async function (connectionString, poolSize = 20) {
	const client = new MongoClient(connectionString, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		poolSize,
	})

	return client.connect()
}
