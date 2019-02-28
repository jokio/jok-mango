import { Db, FilterQuery, FindOneOptions } from 'mongodb'
import mapObject from '../common/mapObject'
import transformIdFilter from '../common/transformIdFilter'
import { DocumentBase, RepositoryOptions } from '../types'

const defaultOptions: FindOneOptions = {
	skip: 0,
	limit: 100,
}

export default function queryFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
	repositoryOptions?: RepositoryOptions,
) {
	return async function query(
		filterQuery: FilterQuery<TDocument> = {},
		options: FindOneOptions = defaultOptions,
	): Promise<TDocument[]> {

		const mongoFilter = repositoryOptions && repositoryOptions.skipIdTransformations
			? filterQuery
			: transformIdFilter(filterQuery)

		return db.collection(collectionName)
			.find<TDocument>(mongoFilter, options)
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
