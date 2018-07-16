import { createStore, combineReducers, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import thunk from 'redux-thunk'

import task from './redux/task'
import objective from './redux/objective'
import level from './redux/level'
import category from './redux/category'
import type from './redux/type'
import course from './redux/course'
import selfAssesmentCreate from './redux/selfAssesmentCreate'
import { userReducer } from './redux/user'
import { userCoursesReducer } from './redux/userCourses'

const reducers = combineReducers({
  task,
  objective,
  level,
  category,
  type,
  course,
  selfAssesmentCreate,
  user: userReducer,
  courses: userCoursesReducer
})

const store = process.env.NODE_ENV === 'development' ?
  createStore(reducers, composeWithDevTools(applyMiddleware(thunk))) :
  createStore(reducers, applyMiddleware(thunk))

export default store
