import { Db } from 'mongodb'
import collectionFn from '../operations/collection'
import createFn from '../operations/create'
import getFn from '../operations/get'
import findFn from '../operations/query'
import updateFn from '../operations/update'
import { DocumentBase } from '../types'

export default function <TDocument extends DocumentBase>(
	db: Db,
	collectionName: string,
) {
	return {
		create: createFn<TDocument>(db, collectionName),
		get: getFn<TDocument>(db, collectionName),
		query: findFn<TDocument>(db, collectionName),
		update: updateFn<TDocument>(db, collectionName),
		collection: collectionFn<TDocument>(db, collectionName),
	}
}
