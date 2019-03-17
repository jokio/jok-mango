import { Db } from 'mongodb'
import collectionFn from '../operations/collection'
import createFn from '../operations/create'
import deleteFn from '../operations/delete'
import getFn from '../operations/get'
import findFn from '../operations/query'
import updateFn from '../operations/update'
import updateManyFn from '../operations/updateMany'
import { DocumentBase, RepositoryOptions } from '../types'

export default function <TDocument extends DocumentBase>(
	db: Db,
	collectionName: string,
	options?: RepositoryOptions,
) {
	return {
		create: createFn<TDocument>(db, collectionName, options),
		get: getFn<TDocument>(db, collectionName, options),
		query: findFn<TDocument>(db, collectionName, options),
		update: updateFn<TDocument>(db, collectionName, options),
		updateMany: updateManyFn<TDocument>(db, collectionName, options),
		delete: deleteFn<TDocument>(db, collectionName, options),
		collection: collectionFn<TDocument>(db, collectionName, options),
	}
}
