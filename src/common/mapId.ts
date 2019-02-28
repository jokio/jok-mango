import { DocumentBase } from '../types'

export function mapId(x: DocumentBase) {
	if (!x || !x.id) {
		return null
	}

	return x.id
}
