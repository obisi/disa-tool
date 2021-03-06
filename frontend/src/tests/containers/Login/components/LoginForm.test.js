import React from 'react'
import { Form } from 'semantic-ui-react'
import { LoginForm } from '../../../../containers/Login/components/form/LoginForm'

describe('LoginForm component', () => {
  let wrapper
  let login

  beforeEach(() => {
    login = jest.fn()
    wrapper = shallow(<LoginForm
      loginAction={data => new Promise((resolve, reject) => {
        login(data)
        if (data.password === 'pass') {
          resolve()
        } else {
          reject()
        }
      })}
      translate={() => ''}
    />)
  })

  it('renders.', () => {
    expect(wrapper.find('.LoginForm').exists()).toEqual(true)
  })

  describe('username field', () => {
    it('changes state on change.', () => {
      expect(wrapper.state('emptyFields').username).toEqual(true)
      wrapper.find('.usernameInput').simulate('change', { target: { value: 'testuser' } })
      expect(wrapper.state('emptyFields').username).toEqual(false)
      wrapper.find('.usernameInput').simulate('change', { target: { value: '' } })
      expect(wrapper.state('emptyFields').username).toEqual(true)
    })
  })

  describe('password field', () => {
    it('changes state on change.', () => {
      expect(wrapper.state('emptyFields').password).toEqual(true)
      wrapper.find('.passwordInput').simulate('change', { target: { value: 'testpassword' } })
      expect(wrapper.state('emptyFields').password).toEqual(false)
      wrapper.find('.passwordInput').simulate('change', { target: { value: '' } })
      expect(wrapper.state('emptyFields').password).toEqual(true)
    })
  })

  describe('submit button', () => {
    // This is totally overkill testing for one button. I got carried away.
    describe('when both fields are empty', () => {
      it('is disabled.', () => {
        expect(wrapper.find('.submitButton').prop('disabled')).toEqual(true)
      })
    })

    describe('when username is entered and password is empty', () => {
      beforeEach(() => {
        wrapper.setState({
          emptyFields: {
            username: false,
            password: true
          }
        })
      })

      it('is disabled.', () => {
        expect(wrapper.find('.submitButton').prop('disabled')).toEqual(true)
      })
    })

    describe('when password is entered and username is empty', () => {
      beforeEach(() => {
        wrapper.setState({
          emptyFields: {
            username: true,
            password: false
          }
        })
      })

      it('is disabled.', () => {
        expect(wrapper.find('.submitButton').prop('disabled')).toEqual(true)
      })
    })

    describe('when both fields are entered', () => {
      beforeEach(() => {
        wrapper.setState({
          emptyFields: {
            username: false,
            password: false
          }
        })
      })

      it('is not disabled.', () => {
        expect(wrapper.find('.submitButton').prop('disabled')).toEqual(false)
      })
    })
  })

  describe('form submit', () => {
    it('calls prop login.', async () => {
      await wrapper.find(Form).simulate('submit', {
        preventDefault: () => {},
        target: {
          username: {
            value: 'user'
          },
          password: {
            value: 'pass'
          }
        }
      })
      expect(login).toHaveBeenCalledWith({
        username: 'user',
        password: 'pass'
      })
    })
  })

  describe('if user prop is present', () => {
    beforeEach(() => {
      wrapper.setProps({
        user: { id: 1 }
      })
    })

    it('component redirects.', async () => {
      expect(wrapper.find('Redirect').exists())
    })
  })
})
