import { FilterQuery } from 'mongodb'
import { DocumentBase } from '../types'

export default function <T extends DocumentBase>(filter: FilterQuery<T>) {
	// map filter.id to _id
	if (filter.id) {
		// if just one id is specified
		if (typeof filter.id === 'string') {
			const filterAny = filter as any
			filterAny['_id'] = filter.id
		}
		// if $in is used
		else if (filter.id['$in'] && Array.isArray(filter.id['$in'])) {
			const ids = filter.id['$in']
			const filterAny = filter as any
			filterAny['_id'] = {
				$in: ids.map((x) => x),
			}
		} else if (filter.id['$ne']) {
			const id = filter.id['$ne']
			const filterAny = filter as any
			filterAny['_id'] = {
				$ne: id,
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
