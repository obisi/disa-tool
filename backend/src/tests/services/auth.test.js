const { checkAuth } = require('../../services/auth.js')

describe('auth service', () => {
  describe('checkAuth function', () => {
    it('returns correct user when token is provided.', () => {
      const req = {
        headers: {
          authorization: `Bearer ${tokens.student}`
        }
      }
      expect(checkAuth(req)).toMatchObject({
        id: 421
      })
      req.headers.authorization = `Bearer ${tokens.teacher}`
      expect(checkAuth(req)).toMatchObject({
        id: 424
      })
    })

    it('returns null when no authorization is provided.', () => {
      const req = {
        headers: {}
      }
      expect(checkAuth(req)).toEqual(null)
    })

    it('returns null when malformed authorization is provided.', () => {
      const req = {
        headers: {
          authorization: tokens.student
        }
      }
      expect(checkAuth(req)).toEqual(null)
    })
  })
})
