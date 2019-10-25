import { ClientSession } from 'mongodb'

export type ID = string

export interface DocumentBase {
	id: ID
	createdAt: Date
	updatedAt: Date
	version: number
	deletedAt?: Date
}

export interface RepositoryOptions {
	session?: ClientSession
	skipIdTransformations?: boolean
	enableIdMapping?: boolean
	query?: QueryOptions
	update?: UpdateOptions
	delete?: DeleteOptions
	logger?: MangoLogger
}

export type MangoLogger = (collectionName: string, action: string, duration: number) => void

export interface QueryOptions {
	defaultLimit: number
}

export interface UpdateOptions {
	returnUpdatedByDefault: boolean
}

export interface DeleteOptions {
	enableSoftDeleteByDefault: boolean
}
