import { Db, ObjectId } from 'mongodb'
import mapObject from '../common/mapObject'
import { Omit } from '../common/omit'
import { DocumentBase, ID, RepositoryOptions } from '../types'

export default function createFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
	repositoryOptions?: RepositoryOptions,
) {
	return async function create(data: Data<TDocument>): Promise<TDocument> {
		const now = new Date()

		const doc = <TDocument>data

		doc['_id'] = repositoryOptions?.skipIdTransformations
			? doc.id || new ObjectId().toHexString()
			: new ObjectId(doc.id || undefined)

		doc.createdAt = doc.createdAt || now
		doc.updatedAt = now
		doc.deletedAt = undefined
		doc.version = 1

		const session =
			(repositoryOptions && repositoryOptions.session) || undefined

		const { result, insertedCount } = await db
			.collection<TDocument>(collectionName)
			.insertOne(doc, { session })

		if (!result.ok || insertedCount !== 1) {
			throw new Error('CREATE_OPERATION_FAILED')
		}

		if (repositoryOptions && repositoryOptions.logger) {
			const duration = Date.now() - now.getTime()

			repositoryOptions.logger(collectionName, 'create', duration)
		}

		return repositoryOptions &&
			repositoryOptions.skipIdTransformations &&
			!repositoryOptions.enableIdMapping
			? doc
			: <TDocument>mapObject(doc)
	}
}

type Data<TDocument extends DocumentBase> =
	| Omit<TDocument, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt'>
	| { id?: ID }
