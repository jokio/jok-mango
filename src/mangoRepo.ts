import {
  ClientSession,
  Db,
  DeleteOptions,
  Filter,
  FindOneAndUpdateOptions,
  FindOptions,
  ObjectId,
  UpdateFilter,
  UpdateOptions,
} from 'mongodb'
import {
  prepareDocument,
  prepareFilterQuery,
  prepareUpdateQuery,
  transformDocumentBack,
} from './domain/transformDocument'

export interface MangoRepoOptions {
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
  logger?: MangoLoggerFn | null
}

/**
 * Repository to work with mongodb
 */
export class MangoRepo<TDocument> {
  protected options: Required<MangoRepoOptions>

  get collection() {
    return this.getDb().collection<TDocument>(this.collectionName)
  }

  constructor(
    protected getDb: () => Db,
    protected collectionName: string,
    options?: MangoRepoOptions,
  ) {
    const defaultOptions: Required<MangoRepoOptions> = {
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

  async create(
    doc: WithOptionalId<Data<TDocument>>,
  ): Promise<TDocument> {
    const { session, logger } = this.options

    const now = new Date()

    // prepare final document
    const finalDoc: any = prepareDocument(doc, now, this.options)

    const { acknowledged } = await this.collection.insertOne(
      finalDoc,
      { session: session ?? undefined },
    )

    if (!acknowledged) {
      throw new Error('MANGO_CREATE_ONE_FAILED')
    }

    const finalResult = transformDocumentBack<TDocument>(
      finalDoc,
      this.options,
    )

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger({
        collectionName: this.collectionName,
        action: 'create',
        duration,
      })
    }

    return finalResult
  }

  async createMany(
    docs: WithOptionalId<Data<TDocument>>[],
  ): Promise<number> {
    const { session, logger } = this.options

    const now = new Date()

    const finalDocs: any[] = docs.map(doc =>
      prepareDocument(doc, now, this.options),
    )

    const { acknowledged, insertedCount } =
      await this.collection.insertMany(finalDocs, {
        session: session ?? undefined,
      })

    if (!acknowledged || insertedCount !== docs.length) {
      throw new Error('MANGO_CREATE_MANY_FAILED')
    }

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger({
        collectionName: this.collectionName,
        action: 'createMany',
        duration,
      })
    }

    return insertedCount
  }

  async count(filter: Filter<TDocument> = {}) {
    const { session, logger } = this.options

    const now = new Date()

    const finalFilter = prepareFilterQuery(filter, this.options)

    const result = await this.collection.countDocuments(finalFilter, {
      session: session ?? undefined,
    })

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger({
        collectionName: this.collectionName,
        action: 'count',
        filter,
        duration,
      })
    }

    return result
  }

  async updateOne(
    filter: Filter<TDocument>,
    updateQuery: UpdateFilter<Data<TDocument>>,
    options?: FindOneAndUpdateOptions,
  ): Promise<TDocument | null> {
    const { returnLatestDocumentByDefault, session, logger } =
      this.options

    const now = new Date()

    const finalFilter = prepareFilterQuery(filter, this.options)

    const finalUpdateQuery: any = prepareUpdateQuery(
      updateQuery,
      now,
      this.options,
    )

    const { value, ok } = await this.collection.findOneAndUpdate(
      finalFilter,
      finalUpdateQuery,
      {
        returnDocument: returnLatestDocumentByDefault
          ? 'after'
          : 'before',
        session: session ?? undefined,
        ...options,
      },
    )

    if (!ok) {
      throw new Error('MANGO_UPDATE_MANY_FAILED')
    }

    const finalResult = value
      ? transformDocumentBack<TDocument>(value, this.options)
      : null

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger({
        collectionName: this.collectionName,
        action: 'updateOne',
        filter,
        duration,
      })
    }

    return finalResult
  }

  async updateMany(
    filter: Filter<TDocument>,
    updateQuery: UpdateFilter<Data<TDocument>>,
    options?: UpdateOptions,
  ): Promise<number> {
    const { session, logger } = this.options

    const now = new Date()

    const finalFilter = prepareFilterQuery(filter, this.options)

    const finalUpdateQuery: any = prepareUpdateQuery(
      updateQuery,
      now,
      this.options,
    )

    const { acknowledged, modifiedCount } =
      await this.collection.updateMany(
        finalFilter,
        finalUpdateQuery,
        {
          session: session ?? undefined,
          ...options,
        },
      )

    if (!acknowledged) {
      throw new Error('MANGO_UPDATE_ONE_FAILED')
    }

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger({
        collectionName: this.collectionName,
        action: 'updateMany',
        filter,
        duration,
      })
    }

    return modifiedCount
  }

  async deleteMany(
    filter: Filter<TDocument>,
    options?: DeleteOptions,
  ): Promise<number> {
    const { session, logger } = this.options

    const now = new Date()

    const finalFilter = prepareFilterQuery(filter, this.options)

    const { acknowledged, deletedCount } =
      await this.collection.deleteMany(finalFilter, {
        session: session ?? undefined,
        ...options,
      })

    if (!acknowledged) {
      throw new Error('MANGO_UPDATE_ONE_FAILED')
    }

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger({
        collectionName: this.collectionName,
        action: 'deleteMany',
        filter,
        duration,
      })
    }

    return deletedCount!
  }

  async getById(id: string): Promise<TDocument | null> {
    const { idTransformation, session, logger } = this.options

    const now = new Date()

    let value = idTransformation ? new ObjectId(id) : id
    let filter: any = { _id: value }

    const doc = await this.collection.findOne<TDocument>(filter, {
      session: session ?? undefined,
    })

    const result = doc
      ? transformDocumentBack<TDocument>(doc, this.options)
      : null

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger({
        collectionName: this.collectionName,
        action: 'getById',
        duration,
      })
    }

    return result
  }

  async query(
    filter: Filter<TDocument>,
    options?: FindOptions<TDocument>,
  ): Promise<TDocument[]> {
    const { session, logger } = this.options

    const now = new Date()

    const finalFilter = prepareFilterQuery(filter, this.options)

    const result = await this.collection
      .find(finalFilter, {
        session: session ?? undefined,
        ...options,
      })
      .toArray()

    const finalResult: TDocument[] = result.map(x =>
      transformDocumentBack(x, this.options),
    )

    if (logger) {
      const duration = Date.now() - now.getTime()

      logger({
        collectionName: this.collectionName,
        action: 'query',
        filter,
        duration,
      })
    }

    return finalResult
  }

  // TODO: create static function which will apply Dates & Version types
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

export type MangoLoggerFn = (data: {
  collectionName: string
  action: string
  filter?: Filter<any>
  duration: number
}) => void

export type WithOptionalId<T> = T & { id?: string | ObjectId }
