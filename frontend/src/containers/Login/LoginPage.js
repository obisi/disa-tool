import React from 'react'
import PropTypes from 'prop-types'
import { withLocalize } from 'react-localize-redux'

import LoginForm from './components/form/LoginForm'
import HakaAuthentication from './components/HakaAuthentication'

export const LoginPage = props => (
  <div className="LoginPage">
    <h1>{props.translate('Login.LoginPage.login')}</h1>
    <LoginForm redirectTo={props.redirectTo} />
    <HakaAuthentication />
  </div>
)

LoginPage.propTypes = {
  redirectTo: PropTypes.string,
  translate: PropTypes.func.isRequired
}

LoginPage.defaultProps = {
  redirectTo: undefined
}

export default withLocalize(LoginPage)
