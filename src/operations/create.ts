import { Db, ObjectId } from 'mongodb'
import mapObject from '../common/mapObject'
import { Omit } from '../common/omit'
import { DocumentBase, ID, RepositoryOptions } from '../types'

export default function createFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
	repositoryOptions?: RepositoryOptions,
) {
	return async function create(
		data: Data<TDocument>,
	): Promise<TDocument> {
		const now = new Date()

		const doc = <TDocument>data

		doc['_id'] = new ObjectId()
		doc.createdAt = doc.createdAt || now
		doc.updatedAt = now
		doc.deletedAt = undefined
		doc.version = 1

		const session = (repositoryOptions && repositoryOptions.session) || undefined

		const {
			result,
			insertedCount,
		} = await db.collection<TDocument>(collectionName).insertOne(doc, { session })

		if (!result.ok ||
			(insertedCount !== 1)) {
			throw new Error('CREATE_OPERATION_FAILED')
		}

		return repositoryOptions && repositoryOptions.skipIdTransformations
			? doc
			: <TDocument>mapObject(doc)
	}
}

type Data<TDocument extends DocumentBase> =
	Omit<TDocument, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt'> | { id?: ID }
