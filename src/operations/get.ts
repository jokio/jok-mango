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

		if (repositoryOptions && repositoryOptions.skipIdTransformations) {
			idParam = id

			doc = await db.collection(collectionName).findOne<TDocument>({
				id: idParam,
			})
		}
		else {
			_id = new ObjectId(id)

			doc = await db.collection(collectionName).findOne<TDocument>({
				_id,
			})
		}

		return repositoryOptions && repositoryOptions.skipIdTransformations
			? doc
			: mapObject(doc)
	}
}
