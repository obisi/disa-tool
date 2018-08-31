import React from 'react'
import { connect } from 'react-redux'
import { Card, Form, Button } from 'semantic-ui-react'
import PropTypes from 'prop-types'
import { withLocalize } from 'react-localize-redux'
import MultiLangInput from '../MultiLangInput'
import AddOpenQuestion from '../addOpenQuestion'
import { changeHeaderAction } from '../../../actions/selfAssesment'

export class SelfAssessmentSection extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      editHeaders: false,
      changedHeaders: {}
    }
  }

  toggleEdit = () => {
    this.props.dispatchHeaderChange({
      changedHeaders: this.state.changedHeaders,
      headerType: this.props.headerType
    })
    this.setState({ editHeaders: !this.state.editHeaders })
  }

  changeHeader = (id, value) => {
    const oldState = this.state.changedHeaders
    oldState[id] = value
    this.setState({ editHeaders: oldState })
  }

  render() {
    const translate = id => this.props.translate(`SelfAssessment.Userform.Sections.${id}`)
    const { final,
      question,
      edit,
      QuestionModule,
      formData,
      errors,
      clearError,
      courseInstanceId,
      grades,
      name,
      headers
    } = this.props

    const { responseText, grade } = errors
    const { editHeaders } = this.state
    let headerEditForm = null
    let renderModules = null

    /* If we are in edit form, show all the questionmodules
    despite their status of being included in the assessment
    */
    if (edit) {
      renderModules = (
        formData.map(questionModules =>
          (
            <QuestionModule
              key={questionModules.id}
              data={questionModules}
              edit={edit}
              final={final}
            />
          )))
    } else {
      /*
    If we are in the response form, show just the modules that are included in the assesment.
     The question boolean tells if we are dealing with open question modules.
     In that case just show them all, since those modules don't have an includedInAssesment boolean
     so the ternary would default to false and we'd never see them in the response form
    */
      renderModules =
        (formData.map(questionModules =>
          (questionModules.includedInAssesment || question ?
            (<QuestionModule
              key={questionModules.id}
              data={questionModules}
              edit={edit}
              final={final}
              courseInstanceId={courseInstanceId}
              gradeError={final ? grade[0] : grade.find(e => e.id === questionModules.id)}
              responseTextError={final ?
                responseText[0] :
                responseText.find(e => e.id === questionModules.id)}
              clearError={clearError}
              grades={grades}
            />)
            :
            null
          )))
    }

    const header = final ?
      (
        <div>
          {formData[0].header}
          {edit ?
            <Button
              onClick={() => this.toggleEdit()}
              style={{ marginLeft: '10px' }}
            >
              {editHeaders ? translate('buttonEdit') : translate('buttonShow')}
            </Button>

            :
            null
          }
        </div>)
      :
      name


    if (editHeaders) {
      headerEditForm =
        (
          <div style={{
            marginBottom: '10px'
          }}
          >
            <Form>
              <MultiLangInput
                headers={headers}
                handleChange={this.changeHeader}
              />
            </Form>
          </div>

        )
    }

    return (
      <div>
        <Card fluid color="red" className="formCard">
          <Card.Content>
            <Card.Header className="cardHead">
              {header}
            </Card.Header>
            <Card.Description>
              {headerEditForm}
            </Card.Description>
            {renderModules}

            {question && edit ?
              <AddOpenQuestion />
              :
              null
            }
          </Card.Content>
        </Card>
      </div >
    )
  }
}

SelfAssessmentSection.defaultProps = {
  question: false,
  final: false,
  headerType: null,
  errors: { grade: [], responseText: [] },
  courseInstanceId: null,
  clearError: null,
  grades: null,
  name: '',
  headers: []
}

SelfAssessmentSection.propTypes = {
  formData: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    includedInAssesment: PropTypes.bool
  })).isRequired,
  edit: PropTypes.bool.isRequired,
  question: PropTypes.bool,
  QuestionModule: PropTypes.func.isRequired,
  final: PropTypes.bool,
  dispatchHeaderChange: PropTypes.func.isRequired,
  headerType: PropTypes.string,
  clearError: PropTypes.func,
  errors: PropTypes.shape({
    responseText: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired
    }))
  }),
  courseInstanceId: PropTypes.number,
  grades: PropTypes.arrayOf(PropTypes.object),
  name: PropTypes.string,
  headers: PropTypes.arrayOf(PropTypes.shape()),
  translate: PropTypes.func.isRequired
}

const mapDispatchToProps = dispatch => ({
  dispatchHeaderChange: data =>
    dispatch(changeHeaderAction(data))
})

export default withLocalize(connect(null, mapDispatchToProps)(SelfAssessmentSection))