import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Button } from 'semantic-ui-react'
import asyncAction from '../../../../utils/asyncAction'

import { details } from '../../../../api/categories'
import { editCategory } from '../../actions/categories'

import ModalForm from '../../../../utils/components/ModalForm'
import MultilingualField from '../../../../utils/components/MultilingualField'

class EditCategoryForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      values: {
        name: {
          eng: '',
          fin: '',
          swe: ''
        }
      }
    }
  }

  editCategorySubmit = e => this.props.editCategory({
    id: this.props.categoryId,
    eng_name: e.target.eng_name.value,
    fin_name: e.target.fin_name.value,
    swe_name: e.target.swe_name.value
  })

  loadDetails = async () => {
    const categoryDetails = (await this.props.details({
      id: this.props.categoryId
    })).data.data
    this.setState({
      loading: false,
      values: {
        name: {
          eng: categoryDetails.eng_name,
          fin: categoryDetails.fin_name,
          swe: categoryDetails.swe_name
        }
      }
    })
  }

  render() {
    return (
      <div className="EditCategoryForm">
        <ModalForm
          header="Muokkaa oppimistavoitetta"
          trigger={<Button onClick={this.loadDetails} icon={{ name: 'edit' }} size="mini" />}
          content={
            <div>
              <MultilingualField field="name" fieldDisplay="nimi" values={this.state.values.name} />
              <Button color="green">Tallenna</Button>
            </div>
          }
          onSubmit={this.editCategorySubmit}
          loading={this.state.loading}
        />
      </div>
    )
  }
}

EditCategoryForm.propTypes = {
  editCategory: PropTypes.func.isRequired,
  categoryId: PropTypes.number.isRequired,
  details: PropTypes.func.isRequired
}

const mapDispatchToProps = dispatch => ({
  editCategory: asyncAction(editCategory, dispatch),
  details
})

export default connect(null, mapDispatchToProps)(EditCategoryForm)