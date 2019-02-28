import { Db, ObjectId } from 'mongodb'
import { Omit } from '../common/omit'
import { DocumentBase } from '../types'

export default function collectionFn<TDocument extends DocumentBase>(
	db: Db,
	collectionName,
) {
	return db.collection<Data<TDocument>>(collectionName)
}

type Data<TDocument extends DocumentBase> =
	Omit<TDocument, 'id'> & { _id: ObjectId }
