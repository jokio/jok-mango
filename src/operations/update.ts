import { Db, FilterQuery, FindOneAndUpdateOption } from 'mongodb'
import mapFilter from '../common/mapFilter'
import mapObject from '../common/mapObject'
import { Omit } from '../common/omit'
import { DocumentBase } from '../types'

export default function updateFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
) {
	return async function update(
		filter: FilterQuery<TDocument>,
		data: Data<TDocument>,
		options?: FindOneAndUpdateOption & ExtendOptionProps,
	): Promise<TDocument | null> {
		const now = new Date()

		const doc: TDocument = <any>data

		doc.updatedAt = now

		const mongoFilter = mapFilter(filter)

		// remove version from updated fields
		// it will be incremented by one
		delete doc['_id']
		delete doc.id
		delete doc.version
		delete doc.createdAt

		// allow caller to skip version update
		const version = options && options.skipVersionUpdate
			? 1
			: 0

		const { ok, value } = await db.collection<TDocument>(collectionName).findOneAndUpdate(
			mongoFilter,
			{
				$set: data,
				$inc: { version },
			},
			options,
		)

		if (!ok) {
			throw new Error('SAVE_DOCUMENT_FAILED')
		}

		return mapObject(value)
	}
}

type Data<TDocument extends DocumentBase> =
	Partial<Omit<TDocument, 'id' | 'createdAt' | 'updatedAt' | 'version'>>

export interface ExtendOptionProps {
	skipVersionUpdate?: boolean
}
