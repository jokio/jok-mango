import { Db, ObjectId } from 'mongodb'
import mapObject from '../common/mapObject'
import { DocumentBase, ID } from '../types'

export default function getFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
) {
	return async function get(id: ID): Promise<TDocument | null> {

		const _id = new ObjectId(id)

		const doc = await db.collection(collectionName).findOne<TDocument>({
			_id,
		})

		return mapObject(doc)
	}
}
