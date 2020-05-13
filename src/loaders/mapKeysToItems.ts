import { DocumentBase } from '../types'

export const mapKeysToItems = (keys: readonly string[]) => <
	T extends DocumentBase
>(
	items: T[],
) => {
	return keys.map((id) => <T>items.find((x) => x.id === id) || null)
}
