import React from 'react'
import PropTypes from 'prop-types'
import AddOpenQuestion from '../addOpenQuestion'
import { Card, Form } from 'semantic-ui-react'

const SelfAssesmentSection = (props) => {
  const { question, formData, edit, handleChange, textArea, header, QuestionModule } = props
  return (
    <div>
      <Card fluid color="red" className="formCard">
        <Card.Content>
          <Card.Header className="cardHead">
            {header}
          </Card.Header>
          <Form>
            {formData.map(questionModules =>
              (<QuestionModule
                key={questionModules.id}
                data={questionModules}
                edit={edit}
                handleChange={handleChange}
                textArea={textArea}
              />))}

            {question ?
              <AddOpenQuestion
                handleChange={handleChange}
              />
              :
              null
            }
          </Form>
        </Card.Content>
      </Card>


    </div>

  )
}

SelfAssesmentSection.defaultProps = {
  question: false
}

SelfAssesmentSection.propTypes = {
  formData: PropTypes.oneOfType([
    PropTypes.shape(),
    PropTypes.arrayOf(PropTypes.shape())
  ]).isRequired,
  edit: PropTypes.bool.isRequired,
  handleChange: PropTypes.func.isRequired,
  textArea: PropTypes.func.isRequired,
  question: PropTypes.bool,
  header: PropTypes.string.isRequired,
  QuestionModule: PropTypes.func.isRequired
}

export default SelfAssesmentSection
