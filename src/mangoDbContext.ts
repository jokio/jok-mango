import {
  ClientSession,
  Db,
  MongoClient,
  SessionOptions,
  TransactionOptions,
} from 'mongodb'

/**
 * Db Context base class
 */
export abstract class MangoDbContext<
  TDbContext extends MangoDbContext<TDbContext> = any,
> {
  abstract collectionNames: { [key: string]: string }
  abstract initializeDbData(): Promise<unknown>

  constructor(protected db: Db, protected session?: ClientSession) {}

  createCollections() {
    const names = Object.values(this.collectionNames)
    if (!names.length) {
      return
    }

    const tasks = names.map(name =>
      this.db.createCollection(name, {
        session: this.session ?? undefined,
      }),
    )

    return Promise.all(tasks)
  }

  deleteCollections() {
    const names = Object.values(this.collectionNames)
    if (!names.length) {
      return
    }

    const tasks = names.map(name => this.db.dropCollection(name))

    return Promise.all(tasks)
  }
}

/**
 * Db Context with transaction support
 *
 * Note: not tested yet
 */
export abstract class MangoDbContextWithTransaction<
  TDbContext extends MangoDbContext<TDbContext> = any,
> extends MangoDbContext<TDbContext> {
  abstract DbContext: TDbContext

  constructor(
    protected db: Db,
    protected session?: ClientSession,
    private client?: MongoClient,
  ) {
    super(db, session)
  }

  async runTransaction<T>(
    action: TransactionAction<T, TDbContext>,
    options?: RunTransactionOptions,
  ) {
    if (!this.client) {
      throw new Error('DB_CLIENT_NOT_DEFINED')
    }

    const session = this.client.startSession(
      options && options.sessionOptions,
    )

    try {
      const ctor: any = this.DbContext
      return session.withTransaction(
        () =>
          <any>action(<any>ctor(this.db, this.client, this.session)),
        options?.transactionOptions,
      )
    } catch (err) {
      await session.abortTransaction()

      throw err
    } finally {
      await session.endSession()
    }
  }
}

export type TransactionAction<T, TDbContext extends MangoDbContext> =
  (db: TDbContext) => Promise<T>

export interface RunTransactionOptions {
  sessionOptions?: SessionOptions
  transactionOptions?: TransactionOptions
}
