import { Db, FilterQuery, FindOneAndUpdateOption } from 'mongodb'
import mapIdFilter from '../common/mapIdFilter'
import transformIdFilter from '../common/transformIdFilter'
import { DocumentBase, RepositoryOptions } from '../types'

export default function deleteFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
	repositoryOptions?: RepositoryOptions,
) {
	return async function deleteOp(
		filter: FilterQuery<TDocument>,
		options?: FindOneAndUpdateOption & ExtendOptionProps,
	): Promise<number> {
		const now = new Date()

		const filter1 =
			repositoryOptions && repositoryOptions.skipIdTransformations
				? filter
				: transformIdFilter(filter)

		const mongoFilter =
			repositoryOptions && repositoryOptions.enableIdMapping
				? mapIdFilter(filter1)
				: filter1

		const softDeleteEnabled =
			repositoryOptions &&
			repositoryOptions.delete &&
			repositoryOptions.delete.enableSoftDeleteByDefault

		const session =
			(repositoryOptions && repositoryOptions.session) || undefined

		if (!softDeleteEnabled || (options && options.forceHardDelete)) {
			const {
				result: { ok: hardDeleteOk },
				deletedCount: hardDeletedCount,
			} = await db
				.collection<TDocument>(collectionName)
				.deleteMany(mongoFilter, { session })

			if (!hardDeleteOk) {
				throw new Error('HARD_DELETE_DOCUMENTS_FAILED')
			}

			return hardDeletedCount || 0
		}

		// allow caller to skip version update
		const version: any = options && options.skipVersionUpdate ? 1 : 0

		const {
			result: { ok },
			modifiedCount,
		} = await db.collection<TDocument>(collectionName).updateMany(
			mongoFilter,
			<any>{
				$set: {
					deletedAt: <any>now,
				},
				$inc: { version },
			},
			{
				...options,
				session,
			},
		)

		if (!ok) {
			throw new Error('SOFT_DELETE_DOCUMENTS_FAILED')
		}

		if (repositoryOptions && repositoryOptions.logger) {
			const duration = Date.now() - now.getTime()

			repositoryOptions.logger(collectionName, 'delete', duration)
		}

		return modifiedCount
	}
}

export interface ExtendOptionProps {
	skipVersionUpdate?: boolean
	forceHardDelete?: boolean
}
