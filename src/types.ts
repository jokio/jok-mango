export type ID = string

export interface DocumentBase {
	id: ID
	createdAt: Date
	updatedAt: Date
	version: number
	isArchived?: boolean
}
