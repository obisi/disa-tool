import { getCourseData } from '../../../../containers/Course/actions/course'
import { testService } from '../../../testUtils'

testService({
  func: getCourseData,
  type: 'COURSE_GET_DATA',
  data: {
    id: 1
  },
  apiRoute: '/course-instances/data/1'
})