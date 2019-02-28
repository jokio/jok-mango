import { ObjectId } from 'mongodb'
import { DocumentBase } from '../types'

export default function <T extends DocumentBase>(obj: T | null | undefined) {
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
