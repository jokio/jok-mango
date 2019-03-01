import { ObjectId } from 'mongodb'
import mapObject from './mapObject'

describe('mapObject', () => {
	it('should substitude { _id: string } with { id: string }', () => {
		const doc = <any>{
			_id: '123',
		}

		expect(mapObject(doc))
			.toEqual({ id: doc._id })
	})

	it('should substitude { _id: ObjectId } with { id: string }', () => {
		const _id = new ObjectId()

		expect(mapObject(<any>{ _id }))
			.toEqual({ id: _id.toHexString() })
	})

	it('should return null if object is falsy', () => {
		expect(mapObject(null))
			.toBe(null)

		expect(mapObject(undefined))
			.toBe(null)
	})
})
