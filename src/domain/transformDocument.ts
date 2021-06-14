import { ObjectId } from 'mongodb'

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
    const { _id, ...rest } = doc as any

    const objectId = _id as ObjectId

    result = {
      ...rest,
      _id: objectId.toHexString(),
    }
  }

  if (idMapping) {
    const { _id, ...rest } = doc as any

    result = {
      ...rest,
      id: _id,
    }
  }

  return result
}
