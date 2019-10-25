import { Db, ObjectId } from 'mongodb'
import mapObject from '../common/mapObject'
import { DocumentBase, ID, RepositoryOptions } from '../types'

export default function getFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
	repositoryOptions?: RepositoryOptions,
) {
	return async function get(id: ID): Promise<TDocument | null> {

		let _id: ObjectId | undefined
		let idParam: string | undefined
		let doc: any

		const now = new Date()

		const session = (repositoryOptions && repositoryOptions.session) || undefined

		if (repositoryOptions && repositoryOptions.skipIdTransformations) {

			idParam = id

			const filter = (repositoryOptions && repositoryOptions.enableIdMapping)
				? { _id: idParam }
				: { id: idParam }

			doc = await db.collection(collectionName).findOne<TDocument>({
				...filter,
			}, { session })
		}
		else {
			_id = new ObjectId(id)

			doc = await db.collection(collectionName).findOne<TDocument>({
				_id,
			}, { session })
		}

		if (repositoryOptions && repositoryOptions.logger) {
			const duration = Date.now() - now.getTime()

			repositoryOptions.logger(collectionName, 'get', duration)
		}

		return (repositoryOptions &&
			(repositoryOptions.skipIdTransformations && !repositoryOptions.enableIdMapping))
			? doc
			: mapObject(doc)
	}
}
