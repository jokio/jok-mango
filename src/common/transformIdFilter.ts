import { FilterQuery, ObjectId } from 'mongodb'
import { DocumentBase } from '../types'

export default function <T extends DocumentBase>(filter: FilterQuery<T>) {
	// map filter.id if its presented to objectId
	// if we need advanced use cases, please use collection
	if (filter.id) {
		// if just one id is specified
		if (typeof filter.id === 'string') {
			const filterAny = filter as any
			filterAny['_id'] = new ObjectId(filter.id)
		}
		// if id is already an objectId
		else if (
			Reflect.has(filter.id as object, '_bsontype') &&
			(filter.id as any)._bsontype === 'ObjectID'
		) {
			const filterAny = filter as any
			filterAny['_id'] = filter.id
		}
		// if $in is used
		else if (filter.id['$in'] && Array.isArray(filter.id['$in'])) {
			const ids = filter.id['$in']

			const filterAny = filter as any
			filterAny['_id'] = {
				$in: ids.map((x) => new ObjectId(x)),
			}
		} else if (filter.id['$ne']) {
			const id = filter.id['$ne']

			const filterAny = filter as any
			filterAny['_id'] = {
				$ne: new ObjectId(id),
			}
		}
		// otherwise please use collection
		else {
			throw new Error("id can't be complex object, please use collection")
		}

		delete filter.id
	}

	return filter
}
