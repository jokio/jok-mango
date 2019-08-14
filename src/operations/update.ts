import { Db, FilterQuery, FindOneAndUpdateOption, UpdateQuery } from 'mongodb'
import mapObject from '../common/mapObject'
import { Omit } from '../common/omit'
import transformIdFilter from '../common/transformIdFilter'
import { DocumentBase, RepositoryOptions } from '../types'
import mapIdFilter from '../common/mapIdFilter';

export default function updateFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
	repositoryOptions?: RepositoryOptions,
) {
	return async function update(
		filter: FilterQuery<TDocument>,
		data: Data<TDocument>,
		options?: FindOneAndUpdateOption & ExtendOptionProps<Data<TDocument>>,
	): Promise<TDocument> {
		const now = new Date()

		const doc: TDocument = <any>data

		doc.updatedAt = now

		const filter1 = repositoryOptions && repositoryOptions.skipIdTransformations
			? filter
			: transformIdFilter(filter)

		const mongoFilter = repositoryOptions && repositoryOptions.enableIdMapping
			? filter1
			: mapIdFilter(filter1)

		const returnUpdatedByDefault = repositoryOptions && repositoryOptions.update
			? repositoryOptions.update.returnUpdatedByDefault
			: undefined

		// remove version from updated fields
		// it will be incremented by one
		delete doc['_id']
		delete doc.id
		delete doc.version
		delete doc.createdAt
		delete doc.deletedAt

		// allow caller to skip version update
		const version = options && options.skipVersionUpdate
			? 1
			: 0

		const updateQuery = options
			? <any>options.updateQuery
			: null

		const session = (repositoryOptions && repositoryOptions.session) || undefined

		const {
			ok,
			value,
		} = await db.collection<TDocument>(collectionName).findOneAndUpdate(
			mongoFilter,
			{
				$set: data,
				$inc: { version },
				...updateQuery,
			},
			{
				returnOriginal: !returnUpdatedByDefault,
				...options,
				session,
			},
		)

		if (!ok) {
			throw new Error('UPDATE_DOCUMENTS_FAILED')
		}

		return <TDocument>mapObject(value)
	}
}

type Data<TDocument extends DocumentBase> =
	Partial<Omit<TDocument, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt'>>

export interface ExtendOptionProps<TDocument> {
	skipVersionUpdate?: boolean
	updateQuery?: UpdateQuery<TDocument>
}
