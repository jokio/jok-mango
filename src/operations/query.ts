import { Db, FilterQuery, FindOneOptions } from 'mongodb'
import mapFilter from '../common/mapFilter'
import mapObject from '../common/mapObject'
import { DocumentBase } from '../types'

const defaultOptions: FindOneOptions = {
	skip: 0,
	limit: 100,
}

export default function queryFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
) {
	return async function query(
		filterQuery: FilterQuery<TDocument> = {},
		options: FindOneOptions = defaultOptions,
	): Promise<TDocument[]> {

		const mongoFilter = mapFilter(filterQuery)

		return db.collection(collectionName)
			.find<TDocument>(mongoFilter, options)
			.toArray()
			.then(items => items
				.map(mapObject)
				.filter(x => !!x)
				.map(x => <TDocument>x),
			)
	}
}
