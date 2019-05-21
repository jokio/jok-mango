import { Db, FilterQuery, FindOneOptions } from 'mongodb'
import mapObject from '../common/mapObject'
import transformIdFilter from '../common/transformIdFilter'
import { DocumentBase, RepositoryOptions } from '../types'

export default function queryFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
	repositoryOptions?: RepositoryOptions,
) {
	return async function query(
		filterQuery: FilterQuery<TDocument> = {},
		options: FindOneOptions & ExtendOptionProps = {},
	): Promise<TDocument[]> {

		if (repositoryOptions && repositoryOptions.query) {
			if (repositoryOptions.query.defaultLimit) {
				// tslint:disable-next-line
				options = {
					limit: repositoryOptions.query.defaultLimit,
					...options,
				}
			}
		}

		if (!options.skipSoftDeletedFilter && repositoryOptions && repositoryOptions.delete) {
			if (repositoryOptions.delete.enableSoftDeleteByDefault) {
				// tslint:disable-next-line
				filterQuery = {
					deletedAt: { $eq: null },
					...filterQuery,
				}
			}
		}

		const mongoFilter = repositoryOptions && repositoryOptions.skipIdTransformations
			? filterQuery
			: transformIdFilter(filterQuery)

		const session = (repositoryOptions && repositoryOptions.session) || undefined

		return db.collection(collectionName)
			.find<TDocument>(mongoFilter, { ...options, session })
			.toArray()
			.then(items => repositoryOptions && repositoryOptions.skipIdTransformations
				? items
				: items
					.map(mapObject)
					.filter(x => !!x)
					.map(x => <TDocument>x),
			)
	}
}

export interface ExtendOptionProps {
	skipSoftDeletedFilter?: boolean
}
