import { DocumentBase } from '../types'

export const mapKeysToItems = <T extends DocumentBase>(
	keys: readonly string[],
	getKey: (item: T) => string = (x) => x.id,
) => (items: T[]) => {
	return keys.map((key) => <T>items.find((x) => getKey(x) === key) || null)
}
