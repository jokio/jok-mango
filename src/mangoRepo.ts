import { ClientSession, Db } from 'mongodb'
import {
  prepareDocument,
  transformDocumentBack,
} from './domain/transformDocument'
import { MangoLogger } from './types'

interface Options {
  /**
   * move `_id` value into `id` field
   *
   * @default true
   */
  idMapping?: boolean

  /**
   * transform ObjectId into string and vice-versa
   *
   * @default true
   */
  idTransformation?: boolean

  /**
   * Enables soft delete, record stays in the database and
   * new field `deletedAt` will be added after deleting the document
   *
   * Query will not return soft deleted entries
   *
   * @default false
   */
  softDeletes?: boolean

  /**
   * The latest version of the document will be returned after update
   *
   * @default true
   */
  returnLatestDocument?: boolean

  /**
   * Adds `version: number` to the document and inc's it on every update
   *
   * @default false
   */
  docVersioning?: boolean

  /**
   * Adds `createdAt` & `updatedAt` dates to the document and sets them automatically
   *
   * `updatedAt` will be undefined until the document will be updated
   *
   * @default false
   */
  docDates?: boolean

  /**
   * Session can be passed for transactions
   */
  session?: ClientSession | null

  /**
   * logger function will be fired on every operation
   *
   * The only exception is when you use `collection` property
   */
  logger?: MangoLogger | null
}

/**
 * Repository to work with mongodb
 */
export class MangoRepo<TDocument> {
  protected options: Required<Options>

  get collection() {
    return this.db.collection<TDocument>(this.collectionName)
  }

  constructor(
    protected db: Db,
    protected collectionName: string,
    options?: Options,
  ) {
    const defaultOptions: Required<Options> = {
      idMapping: true,
      idTransformation: true,
      softDeletes: false,
      returnLatestDocument: true,
      docVersioning: false,
      docDates: false,
      logger: null,
      session: null,
    }

    this.options = {
      ...defaultOptions,
      ...options,
    }
  }

  async create(doc: Data<TDocument>): Promise<TDocument> {
    const { session, logger } = this.options

    const now = new Date()

    // prepare final document
    const finalDoc: any = prepareDocument(doc, now, this.options)

    const { result, insertedCount } = await this.collection.insertOne(
      finalDoc,
      { session: session ?? undefined },
    )

    if (!result.ok || insertedCount !== 1) {
      throw new Error('CREATE_OPERATION_FAILED')
    }

    const finalResult = transformDocumentBack<TDocument>(
      finalDoc,
      this.options,
    )

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger(this.collectionName, 'create', duration)
    }

    return finalResult
  }

  async createMany(docs: Data<TDocument>[]): Promise<number> {
    const { session, logger } = this.options

    const now = new Date()

    const finalDocs: any[] = docs.map(doc =>
      prepareDocument(doc, now, this.options),
    )

    const { result, insertedCount } = await this.db
      .collection<TDocument>(this.collectionName)
      .insertMany(finalDocs, { session: session ?? undefined })

    if (!result.ok || insertedCount !== docs.length) {
      throw new Error('CREATE_OPERATION_FAILED')
    }

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger(this.collectionName, 'create', duration)
    }

    return insertedCount
  }
}

// helper types
type Data<T> = Omit<
  T,
  '_id' | 'id' | keyof MangoDocumentVersion | keyof MangoDocumentDates
>

export type MangoDocumentVersion = {
  version: number
}

export type MangoDocumentDates = {
  createdAt: Date
  updatedAt?: Date
}
