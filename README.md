# @jokio/monzo
[![platform: jokio](https://img.shields.io/badge/platform-%F0%9F%83%8F%20jok-44cc11.svg)](https://github.com/jokio/jok-cli)

Library will help to work with mongodb

<br/>

## Features
✅ Stores `_id: ObjectId` field, but wraps it to the `id: string` 

✅ Documents have `version: number` out of the box, and its increased by `1` every time you call update

✅ Every document has `createdAt` and `updatedAt` props

✅ Soft Delete & Hard Delete ability for documents

<br/>
<br/>

## How to use
1.  Declare data structure

```ts
import { DocumentBase } from '@jokio/monzo'

export interface User extends DocumentBase {
	email: string
	passwordHash: string
	fullname?: string
}
```

2. Create repository object for declared type
```ts
import { getRepository } from '@jokio/monzo'

const connectionString = `mongodb://mongo:mongo@localhost:27017/test?authSource=admin`
const client = new MongoClient(connectionString, { useNewUrlParser: true })

await client.connect()

const db = client.db()

const users = getRepository<User>(db, 'users')
```


3. Use repository object
```ts
const user = await users.create({
	email: 'test@jok.io',
	passwordHash: 'strong-hash',
})


const { id, version } = user

const updatedUser = await users.update(
	{ id, version },
	{
		email: 'tester@jok.io',
	},
)
```

## Performance Cost

Library calls `_id.toHexString()` for all retrieved items to have `id: string` and make developers life easier, so logical quetion is: How expensive operation is it.

| Number of Operations 	| Duration 			|
|---------------------: |----------------	|
| 1                     | ~83 μs          |
| 1 000                 |                	|
| 1 000 000             | ~250 ms        	|
