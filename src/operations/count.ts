import { Db, FilterQuery } from 'mongodb'
import { DocumentBase, RepositoryOptions } from '../types'

export default function countFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
	repositoryOptions?: RepositoryOptions,
) {
	return async function count(
		filterQuery: FilterQuery<TDocument> = {},
	): Promise<number> {
		const now = new Date()

		const session = (repositoryOptions && repositoryOptions.session) || undefined

		const result = await db.collection(collectionName)
			.countDocuments(filterQuery, { session })

		if (repositoryOptions && repositoryOptions.logger) {
			const duration = Date.now() - now.getTime()

			repositoryOptions.logger(collectionName, 'count', duration)
		}

		return result
	}
}
