import { Db, FilterQuery, FindOneAndUpdateOption } from 'mongodb'
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

		const mongoFilter = (repositoryOptions && repositoryOptions.skipIdTransformations)
			? filter
			: transformIdFilter(filter)

		const softDeleteEnabled = repositoryOptions && repositoryOptions.delete
			&& repositoryOptions.delete.enableSoftDeleteByDefault

		if (!softDeleteEnabled || (options && options.forceHardDelete)) {

			const {
				result: { ok: hardDeleteOk },
				deletedCount: hardDeletedCount,
			} = await db.collection<TDocument>(collectionName).deleteMany(mongoFilter)

			if (!hardDeleteOk) {
				throw new Error('HARD_DELETE_DOCUMENTS_FAILED')
			}

			return hardDeletedCount || 0
		}

		// allow caller to skip version update
		const version = options && options.skipVersionUpdate
			? 1
			: 0

		const {
			result: { ok },
			modifiedCount,
		} = await db.collection<TDocument>(collectionName).updateMany(
			mongoFilter,
			{
				$set: {
					deletedAt: now,
				},
				$inc: { version },
			},
			options,
		)

		if (!ok) {
			throw new Error('SOFT_DELETE_DOCUMENTS_FAILED')
		}

		return modifiedCount
	}
}

export interface ExtendOptionProps {
	skipVersionUpdate?: boolean
	forceHardDelete?: boolean
}
