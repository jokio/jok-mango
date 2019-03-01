import { ObjectId } from 'mongodb'
import { DocumentBase } from '../types'

type Param<T> = T | null | undefined

export default function <T extends DocumentBase>(_obj: Param<T>) {
	const obj = <Param<T>>{ ..._obj }

	if (!obj) {
		return null
	}

	const _id: ObjectId = obj['_id']

	if (_id) {
		if (_id instanceof ObjectId) {
			obj.id = _id.toHexString()
		}
		else {
			obj.id = _id
		}

		delete obj['_id']
	}

	return obj
}
