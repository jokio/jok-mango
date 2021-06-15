import {
  ClientSession,
  CommonOptions,
  Db,
  FilterQuery,
  FindOneAndUpdateOption,
  FindOneOptions,
  ObjectId,
  UpdateManyOptions,
  UpdateQuery,
} from 'mongodb'
import {
  prepareDocument,
  prepareFilterQuery,
  prepareUpdateQuery,
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
   * always applies to the _id field
   *
   * @default true
   */
  idTransformation?: boolean

  /**
   * The latest version of the document will be returned after update
   *
   * @default true
   */
  returnLatestDocumentByDefault?: boolean

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
      returnLatestDocumentByDefault: true,
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

  async insertOne(doc: Data<TDocument>): Promise<TDocument> {
    const { session, logger } = this.options

    const now = new Date()

    // prepare final document
    const finalDoc: any = prepareDocument(doc, now, this.options)

    const { result, insertedCount } = await this.collection.insertOne(
      finalDoc,
      { session: session ?? undefined },
    )

    if (!result.ok || insertedCount !== 1) {
      throw new Error('MANGO_CREATE_ONE_FAILED')
    }

    const finalResult = transformDocumentBack<TDocument>(
      finalDoc,
      this.options,
    )

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger(this.collectionName, 'insertOne', duration)
    }

    return finalResult
  }

  async insertMany(docs: Data<TDocument>[]): Promise<number> {
    const { session, logger } = this.options

    const now = new Date()

    const finalDocs: any[] = docs.map(doc =>
      prepareDocument(doc, now, this.options),
    )

    const { result, insertedCount } = await this.db
      .collection<TDocument>(this.collectionName)
      .insertMany(finalDocs, { session: session ?? undefined })

    if (!result.ok || insertedCount !== docs.length) {
      throw new Error('MANGO_CREATE_MANY_FAILED')
    }

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger(this.collectionName, 'insertMany', duration)
    }

    return insertedCount
  }

  async count(filterQuery: FilterQuery<TDocument> = {}) {
    const { session, logger } = this.options

    const now = new Date()

    const result = await this.collection.count(filterQuery, {
      session: session ?? undefined,
    })

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger(this.collectionName, 'count', duration)
    }

    return result
  }

  async updateOne(
    filter: FilterQuery<TDocument>,
    updateQuery: UpdateQuery<Data<TDocument>>,
    options?: FindOneAndUpdateOption<TDocument>,
  ): Promise<TDocument> {
    const { returnLatestDocumentByDefault, session, logger } =
      this.options

    const now = new Date()

    const finalFilter = prepareFilterQuery(filter, this.options)

    const finalUpdateQuery: any = prepareUpdateQuery(
      updateQuery,
      now,
      this.options,
    )

    const { ok, value } = await this.collection.findOneAndUpdate(
      finalFilter,
      finalUpdateQuery,
      {
        ...options,
        session: session ?? undefined,
        returnDocument: returnLatestDocumentByDefault
          ? 'after'
          : 'before',
      },
    )

    if (!ok) {
      throw new Error('MANGO_UPDATE_MANY_FAILED')
    }

    const finalResult = transformDocumentBack<TDocument>(
      value,
      this.options,
    )

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger(this.collectionName, 'updateOne', duration)
    }

    return finalResult
  }

  async updateMany(
    filter: FilterQuery<TDocument>,
    updateQuery: UpdateQuery<Data<TDocument>>,
    options?: UpdateManyOptions,
  ): Promise<number> {
    const { session, logger } = this.options

    const now = new Date()

    const finalFilter = prepareFilterQuery(filter, this.options)

    const finalUpdateQuery: any = prepareUpdateQuery(
      updateQuery,
      now,
      this.options,
    )

    const {
      result: { ok },
      modifiedCount,
    } = await this.collection.updateMany(
      finalFilter,
      finalUpdateQuery,
      {
        ...options,
        session: session ?? undefined,
      },
    )

    if (!ok) {
      throw new Error('MANGO_UPDATE_ONE_FAILED')
    }

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger(this.collectionName, 'updateMany', duration)
    }

    return modifiedCount
  }

  async deleteMany(
    filter: FilterQuery<TDocument>,
    options: CommonOptions,
  ): Promise<number> {
    const { session, logger } = this.options

    const now = new Date()

    const finalFilter = prepareFilterQuery(filter, this.options)

    const {
      result: { ok },
      deletedCount,
    } = await this.collection.deleteMany(finalFilter, {
      ...options,
      session: session ?? undefined,
    })

    if (!ok) {
      throw new Error('MANGO_UPDATE_ONE_FAILED')
    }

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger(this.collectionName, 'deleteMany', duration)
    }

    return deletedCount!
  }

  async getById(id: string): Promise<TDocument | null> {
    const { idMapping, idTransformation, session, logger } =
      this.options

    const now = new Date()

    let value = idTransformation ? new ObjectId(id) : id
    let filter: any = idMapping ? { _id: value } : { id: value }

    const doc = await this.collection.findOne<TDocument>(filter, {
      session: session ?? undefined,
    })

    const result = doc
      ? transformDocumentBack<TDocument>(doc, this.options)
      : null

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger(this.collectionName, 'getById', duration)
    }

    return result
  }

  async query(
    filter: FilterQuery<TDocument>,
    options: FindOneOptions<TDocument>,
  ): Promise<TDocument[]> {
    const { session, logger } = this.options

    const now = new Date()

    const finalFilter = prepareFilterQuery(filter, this.options)

    const result = await this.collection
      .find(finalFilter, {
        ...options,
        session: session ?? undefined,
      })
      .toArray()

    const finalResult: TDocument[] = result.map(x =>
      transformDocumentBack(x, this.options),
    )

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger(this.collectionName, 'updateOne', duration)
    }

    return finalResult
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
