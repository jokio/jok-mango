import { Db, ObjectId } from 'mongodb'
import { Omit } from '../common/omit'
import { DocumentBase, ID, RepositoryOptions } from '../types'

export default function createManyFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
	_repositoryOptions?: RepositoryOptions,
) {
	return async function createMany(
		data: Data<TDocument>[],
	): Promise<number> {
		const now = new Date()

		const docs = data
			.map(x => <TDocument>x)
			.map(x => <TDocument><any>{
				_id: new ObjectId(),
				createdAt: x.createdAt || now,
				updatedAt: now,
				deletedAt: undefined,
				version: 1,
				...x,
			})

		const {
			result,
			insertedCount,
		} = await db.collection<TDocument>(collectionName).insertMany(docs)

		if (!result.ok ||
			(insertedCount !== data.length)) {
			throw new Error('CREATE_OPERATION_FAILED')
		}

		return insertedCount
	}
}

type Data<TDocument extends DocumentBase> =
	Omit<TDocument, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt'> | { id?: ID }
