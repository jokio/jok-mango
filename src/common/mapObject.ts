import { ObjectId } from 'mongodb'
import { DocumentBase } from '../types'

type Param<T> = T | null | undefined

export default function <T extends DocumentBase>(doc: Param<T>) {
	if (!doc) {
		return null
	}

	const obj = { ...doc }

	const _id: ObjectId = obj['_id']

	if (_id) {
		if (
			Reflect.has(_id, '_bsontype') &&
			(_id as any)._bsontype.toLocaleLowerCase() === 'objectid'
		) {
			obj.id = _id.toHexString()
		} else {
			obj.id = _id as any
		}

		delete obj['_id']
	}

	return obj
}
