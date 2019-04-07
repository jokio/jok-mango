import { FilterQuery, ObjectId } from 'mongodb'
import { DocumentBase } from '../types'

export default function <T extends DocumentBase>(filter: FilterQuery<T>) {

	// map filter.id if its presented to objectId
	// if we need advanced use cases, please use collection
	if (filter.id) {
		// if just one id is specified
		if (typeof filter.id === 'string') {
			filter['_id'] = new ObjectId(filter.id)
		}
		// if $in is used
		else if (filter.id['$in'] && (Array.isArray(filter.id['$in']))) {
			const ids = filter.id['$in']
			filter['_id'] = {
				$in: ids.map(x => new ObjectId(x)),
			}
		}
		else if (filter.id['$ne']) {
			const ids = filter.id['$ne']
			filter['_id'] = {
				$ne: ids.map(x => new ObjectId(x)),
			}
		}
		// otherwise please use collection
		else {
			throw new Error('id can\'t be complex object, please use collection')
		}

		delete filter.id
	}

	return filter
}
