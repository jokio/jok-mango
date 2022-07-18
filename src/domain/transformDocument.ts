import { Filter, ObjectId, UpdateFilter } from 'mongodb'

interface Options {
  idMapping: boolean
  idTransformation: boolean
  docVersioning: boolean
  docDates: boolean
}

export function prepareDocument<TDocument>(
  doc: any,
  dateNow: Date,
  options: Options,
): TDocument {
  const { docVersioning, docDates } = options

  const {
    _id: objectId,
    id,
    version,
    createdAt,
    updatedAt,
    ...data
  } = doc as any

  let _id = getMongoDocumentId(doc, options)

  // prepare final document
  return {
    ...data,
    _id,
    ...(docVersioning ? { version: 1 } : null),
    ...(docDates ? { createdAt: dateNow } : null),
  }
}

export function getMongoDocumentId<TDocument>(
  doc: TDocument,
  options: Options,
): ObjectId | string {
  const { idMapping, idTransformation } = options

  const { _id: objectId, id } = doc as any

  let _id = objectId

  if (idMapping) {
    _id = id
  }

  if (idTransformation) {
    _id = new ObjectId(_id)
  }

  return _id
}

export function transformDocumentBack<TDocument>(
  doc: any,
  options: Options,
): TDocument {
  const { idMapping, idTransformation } = options

  let result = doc as any

  if (idTransformation) {
    const { _id, ...rest } = result

    const objectId = _id as ObjectId

    result = {
      ...rest,
      _id: objectId.toHexString(),
    }
  }

  if (idMapping) {
    const { _id, ...rest } = result

    result = {
      ...rest,
      id: _id,
    }
  }

  return result
}

export function prepareFilterQuery<TDocument>(
  filter: Filter<TDocument>,
  options: Options,
): Filter<TDocument> {
  const { idMapping, idTransformation } = options

  let result = filter

  if (idMapping) {
    const { id, ...rest } = result

    if (id) {
      result = { ...rest, _id: id }
    }
  }

  if (idTransformation) {
    const { _id } = result

    if (_id) {
      switch (typeof _id) {
        case 'string':
          result = {
            ...result,
            _id: new ObjectId(_id),
          }
          break

        case 'object':
          {
            result = {
              ...result,
              _id: Object.fromEntries(
                Object.entries(_id as any).map(([key, value]) => [
                  key,
                  value
                    ? Array.isArray(value)
                      ? value.map(x => mapToObjectId(x))
                      : mapToObjectId(value)
                    : value,
                ]),
              ),
            }
          }
          break
      }
    }
  }

  return result
}

function mapToObjectId(value: unknown) {
  if (typeof value === 'string' && value.length === 24) {
    return new ObjectId(value)
  }

  return value
}

export function prepareUpdateQuery<TDocument>(
  query: UpdateFilter<TDocument>,
  dateNow: Date,
  options: Options,
): Filter<TDocument> {
  const { docVersioning, docDates } = options

  let result = query

  if (docVersioning) {
    result = {
      ...result,

      $inc: {
        ...(query.$inc as any),
        version: 1,
      },
    }
  }

  if (docDates) {
    result = {
      ...result,

      $set: {
        ...(query.$set as any),
        updatedAt: dateNow,
      },
    }
  }

  return result
}
