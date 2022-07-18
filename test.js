const { MongoClient } = require('mongodb')

const client = new MongoClient(
  'mongodb+srv://developer:WetMhj7HQkq2yYUR@jok-prod.z5ywe.mongodb.net/jok?retryWrites=true&w=majority',
)

console.log(client)

// client.connect().then(async x => {
//   const db = x.db()

//   const items = await db.listCollections().toArray()

//   console.log(items)
// })
