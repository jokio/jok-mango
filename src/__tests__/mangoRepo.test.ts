import getClient from '../common/getClient'
import {
	MangoDocumentDates,
	MangoDocumentVersion,
	MangoRepo,
} from '../mangoRepo'

type User = MangoDocumentVersion &
	MangoDocumentDates & {
		nickname: string
	}

describe('mangoRepo', () => {
	it('should work', async () => {
		const client = await getClient('')

		const repo = new MangoRepo<User>(client.db(), 'test', {
			docVersioning: true,
			docDates: true,
		})

		// const repo.create({nickname})
	})
})
