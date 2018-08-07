import React from 'react'
import { SelfAssesmentForm } from '../../../containers/SelfAssesment/Userform/SelfAssesmentForm'
import { Button } from 'semantic-ui-react'
import SelfAssesmentSection from '../../../containers/SelfAssesment/Userform/FormParts/Sections/SelfAssesmentSection'
import { Redirect } from 'react-router'
import { getCourseInstance } from '../../../api/courses'
import { getCourseData } from '../../../api/categories'


const dispatchCreateFormAction = jest.fn()
const dispatchUpdateSelfAssesmentAction = jest.fn()
const dispatchInitNewFormAction = jest.fn()
const dispatchGetAssesmentResponseAction = jest.fn()
const dispatchGetSelfAssesmentAction = jest.fn()
jest.mock('../../../api/courses')
jest.mock('../../../api/categories')

const formData = {
  course_instance_id: 2,
  open: false,
  active: false,
  immediate_feedback: false,
  structure: {
    headers: {
      openQ: {},
      questionHeaders: {},
      grade: {}
    },
    openQuestions: {}
  }
}

const selfAssesmentform = (edit, n) => (
  shallow(<SelfAssesmentForm
    match={{
      params: {
        courseInstanceId: 1,
        selfAssesmentId: 1,
        type: 'category'
      }
    }}
    edit={edit}
    new={n}
    dispatchCreateFormAction={dispatchCreateFormAction}
    dispatchUpdateSelfAssesmentAction={dispatchUpdateSelfAssesmentAction}
    dispatchInitNewFormAction={dispatchInitNewFormAction}
    dispatchGetAssesmentResponseAction={dispatchGetAssesmentResponseAction}
    dispatchGetSelfAssesmentAction={dispatchGetSelfAssesmentAction}
  />)
)

describe('Self assesment form', () => {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<SelfAssesmentForm
      match={{
        params: {
          courseInstanceId: 1,
          selfAssesmentId: 1,
          type: 'category'
        }
      }}
      edit={false}
      new={false}
      dispatchCreateFormAction={dispatchCreateFormAction}
      dispatchUpdateSelfAssesmentAction={dispatchUpdateSelfAssesmentAction}
      dispatchInitNewFormAction={dispatchInitNewFormAction}
      dispatchGetAssesmentResponseAction={dispatchGetAssesmentResponseAction}
      dispatchGetSelfAssesmentAction={dispatchGetSelfAssesmentAction}
    />)
  })

  describe('with edit, new and category', () => {
    beforeEach(() => {
      wrapper.setProps({
        edit: true,
        new: true,
        type: 'category',
        formData: { ...formData, structure: { ...formData.structure, type: 'category' } }

      })
    })
    it('renders correctly', () => {
      expect(wrapper.find('.selfAssesmentForm').exists()).toEqual(true)
    })
    it('shows the correct label on the button', () => {
      expect(wrapper.find(Button).props().children).toEqual('Tallenna')
    })

    it('contains questionmodules of type category', () => {
      const { displayName } = wrapper.find(SelfAssesmentSection).at(0).prop('QuestionModule')
      expect(displayName).toBe('Connect(CategoryQuestionModule)')
      expect(wrapper.find(SelfAssesmentSection).length).toBe(3)
    })

    it('calls the correct function on click', (done) => {
      wrapper.find(Button).simulate('click')
      setTimeout(() => {
        wrapper.update()
        expect(dispatchCreateFormAction).toHaveBeenCalled()
        expect(wrapper.find(Redirect).exists()).toEqual(true)
        done()
      }, 100)
    })
  })

  describe('with edit, new and objective', () => {
    beforeEach(() => {
      wrapper.setProps({
        edit: true,
        new: true,
        type: 'category',
        formData: { ...formData, structure: { ...formData.structure, type: 'objective' } }

      })
    })
    it('contains question modules of type objective', () => {
      const { displayName } = wrapper.find(SelfAssesmentSection).at(0).prop('QuestionModule')
      expect(displayName).toBe('Connect(ObjectiveQuestionModule)')
      expect(wrapper.find(SelfAssesmentSection).length).toBe(2)
    })
  })

  describe('with edit and existing data', () => {
    beforeEach(() => {
      wrapper.setProps({
        edit: true,
        new: false,
        type: 'category',
        formData
      })
    })

    it('has the correct label on button', () => {
      expect(wrapper.find(Button).props().children).toEqual('Päivitä')
    })

    it('calls the correct function on click', (done) => {
      wrapper.find(Button).simulate('click')
      setTimeout(() => {
        wrapper.update()
        expect(dispatchUpdateSelfAssesmentAction).toHaveBeenCalled()
        expect(wrapper.find(Redirect).exists()).toEqual(true)
        done()
      }, 100)
    })
  })
})