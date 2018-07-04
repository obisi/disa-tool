import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button } from 'semantic-ui-react'
import asyncAction from '../../../../utils/asyncAction'

import { removeType } from '../../services/types'

class RemoveTypeForm extends Component {
  removeType = e => {
    this.props.removeType({
      typeId: this.props.id
    })
  }

  render() {
    return (
      <div className="removeTypeForm">
        <Button onClick={this.removeType} icon={{ name: 'delete' }} color="red" size="small" />
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    ...ownProps
  }
}

const mapDispatchToProps = dispatch => {
  return {
    removeType: asyncAction(removeType, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RemoveTypeForm)