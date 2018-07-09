import React from 'react'
import { CoursePage } from '../../../containers/Course/CoursePage'
import CourseHeader from '../../../containers/Course/components/header/CourseHeader'
import Matrix from '../../../containers/Course/components/matrix/Matrix'
import Tasklist from '../../../containers/Course/components/tasks/Tasklist'
import Typelist from '../../../containers/Course/components/types/Typelist'

const mockFn = () => {}

const createWrapper = () => shallow(<CoursePage
  courseId={1}
  course={{}}
  editing={false}
  loading={false}
  getCourseData={mockFn}
/>)

describe('Course page', () => {
  let wrapper

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('renders', () => {
    expect(wrapper.find('.CoursePage').exists()).toEqual(true)
  })

  it('renders CourseHeader', () => {
    expect(wrapper.find(CourseHeader).exists()).toEqual(true)
  })

  it('renders Matrix', () => {
    expect(wrapper.find(Matrix).exists()).toEqual(true)
  })

  it('renders Tasklist', () => {
    expect(wrapper.find(Tasklist).exists()).toEqual(true)
  })

  it('renders Typelist', () => {
    expect(wrapper.find(Typelist).exists()).toEqual(true)
  })

  describe('while loading', () => {
    beforeEach(() => {
      wrapper = createWrapper()
      wrapper.setProps({
        ...wrapper.props(),
        loading: true
      })
    })

    it('does not render', () => {
      expect(wrapper.find('.CoursePage').exists()).toEqual(false)
    })
  })
})