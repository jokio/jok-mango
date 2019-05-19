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

		if (repositoryOptions && repositoryOptions.skipIdTransformations) {
			_id = undefined
			idParam = id
		}
		else {
			_id = new ObjectId(id)
		}

		const doc = await db.collection(collectionName).findOne<TDocument>({
			_id,
			id: idParam,
		})

		return repositoryOptions && repositoryOptions.skipIdTransformations
			? doc
			: mapObject(doc)
	}
}
