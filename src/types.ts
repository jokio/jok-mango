export type ID = string

export interface DocumentBase {
	id: ID
	createdAt: Date
	updatedAt: Date
	version: number
	deletedAt?: Date
}

export interface RepositoryOptions {
	skipIdTransformations?: boolean
	query?: QueryOptions
	update?: UpdateOptions
	delete?: DeleteOptions
}

export interface QueryOptions {
	defaultLimit: number
}

export interface UpdateOptions {
	returnUpdatedByDefault: boolean
}

export interface DeleteOptions {
	enableSoftDeleteByDefault: boolean
}
