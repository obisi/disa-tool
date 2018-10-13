const {
  AssessmentResponse,
  Category,
  CategoryGrade,
  Grade,
  Objective,
  Person,
  SelfAssessment,
  Task,
  SkillLevel,
  TaskResponse
} = require('../database/models')
const gradeService = require('../services/grade_service')
const objectiveService = require('../services/objective_service')
const feedbackTextGenerator = require('./feedback_text_service')

const getOne = async (user, selfAssesmentId, lang) => {
  const found = await AssessmentResponse.find({
    where: { person_id: user.id, self_assessment_id: selfAssesmentId }
  })
  if (!found) {
    return found
  }
  const filteredResponse = await getGradesAndHeader(found.get({ plain: true }), lang)
  const assesmentResponse = found.get({ plain: true })
  assesmentResponse.response = filteredResponse
  return assesmentResponse
}

const create = async (user, selfAssesmentId, data) => AssessmentResponse.find({
  where: { person_id: user.id, self_assessment_id: selfAssesmentId }
}).then((found) => {
  if (!found) {
    /* Swap the final grade category headers to final grade 'main' header
      (from 'Anna itsellesi arvosana kurssista' => 'Loppuarvosana' etc)
     and remove the redundant category header
    */
    const filteredData = { ...data }
    filteredData.finalGradeResponse.headers = swapHeaders(filteredData)
    delete filteredData.finalHeaders

    // TODO: NOTE THAT THIS NOW ONLY BUILDS! NEED TO SAVE SEPARATELY!
    return AssessmentResponse.build({
      response: filteredData, self_assessment_id: selfAssesmentId, person_id: user.id
    })
  }
  throw Error('Olet jo vastannut tähän itsearvioon!')
})

// TODO: Heavy refactoring and testing
const verifyAssessmentGrade = async (response, lang) => {
  const courseGrades = await Grade.findAll({
    include: [
      { model: SkillLevel, where: { course_instance_id: response.response.course_instance_id } },
      CategoryGrade
    ]
  })
  const courseCategories = await Category.findAll({
    where: { course_instance_id: response.response.course_instance_id },
    include: CategoryGrade
  })
  const userTasks = await TaskResponse.findAll({ where: { person_id: response.person_id } })
  // go through each question field
  const earnedGrades = await Promise.all(response.response.questionModuleResponses.map(async (categoryResp) => {
    const categoryGrades = courseCategories.find(category => category.id === categoryResp.id).category_grades
    // find the grade user wants
    const wantedGrade = {
      id: categoryGrades.find(grade => grade.grade_id === categoryResp.grade).id,
      name: courseGrades.find(grade => grade.id === categoryResp.grade)[`${lang}_name`]
    }
    // find current category, include objectives and tasks
    const category = await Category.find({
      where: { id: categoryResp.id },
      include: { model: Objective, include: Task }
    })

    // Check what grades meet requirements
    const gradeQualifies = await calculateStatsForGrades(
      courseGrades,
      categoryGrades,
      response,
      category,
      userTasks,
      lang)
    // If any prerequisite is not met, user does not earn the grade,
    // even if points otherwise would be enough
    const gradesWithDepth = gradeQualifies.map(grade => (
      calculateGradeDepth(grade, gradeQualifies)
    ))
    // Find the highest grade earned. This is the grade with biggest recursive depth,
    // i.e. most levels of prerequisites
    let earnedGrade = { gradeId: null, depth: -1 }
    for (let i = 0; i < gradesWithDepth.length; i += 1) {
      const grade = gradesWithDepth[i]
      if (grade.qualifiedForGrade && grade.depth >= earnedGrade.depth) {
        earnedGrade = grade
      }
    }
    const gradeForName = courseGrades.find(grade => grade.id === earnedGrade.gradeId)
    earnedGrade.name = gradeForName ? gradeForName[`${lang}_name`] : null
    const wantedDepth = gradesWithDepth.find(grade => grade.categoryGradeId === wantedGrade.id).depth
    wantedGrade.difference = wantedDepth - earnedGrade.depth
    return {
      gradeQualifies: gradesWithDepth,
      earnedGrade,
      wantedGrade,
      categoryId: category.id,
      categoryName: category[`${lang}_name`]
    }
  }))
  return { categoryVerifications: earnedGrades, overallVerification: {} }
}

const calculateStatsForGrades = (courseGrades, categoryGrades, response, category, userTasks, lang) => (
  Promise.all(courseGrades.map(async (grade) => {
    // Find objectives related to grade
    const gradeObjectives = await objectiveService.getObjectivesBySkillCourseCategory(
      grade.skill_level_id,
      response.response.course_instance_id,
      category.id)
    // Filter out objectives with no tasks.
    const filteredObjectives = gradeObjectives.filter(objective => objective.tasks.length > 0)
    // Get point sums for each objective.
    const objectivePoints = await calculateObjectivePointSums(filteredObjectives, userTasks, lang)
    // calculate relative point sums over objectives
    const userPoints = objectivePoints.reduce((acc, curr) => (
      acc + curr.userPoints / curr.maxPoints), 0) / objectivePoints.length
    // calculate max points available for category
    const categoryPoints = objectivePoints.reduce((acc, curr) => (
      acc + curr.maxPoints), 0)
    // Get the right category grade for the correct pass level
    const categoryGrade = categoryGrades.find(cg => cg.grade_id === grade.id)
    return {
      categoryGradeId: categoryGrade.id,
      gradeId: grade.id,
      objectivePoints,
      userPoints,
      categoryPoints,
      // user is qualified for grade if the points exceed the needed level
      qualifiedForGrade: userPoints >= grade.needed_for_grade,
      prerequisiteId: grade.prerequisite,
      skillLevelId: grade.skill_level_id,
      skillLevelName: grade.skill_level[`${lang}_name`],
      needed: categoryGrade.needed_for_grade
    }
  }))
)

// Get point sums for all objectives.
const calculateObjectivePointSums = (gradeObjectives, userTasks, lang) => (
  Promise.all(gradeObjectives.map(async (objective) => {
    // filter out tasks with no responses
    const filteredTasks = objective.tasks.filter(task => TaskResponse.count({ where: { task_id: task.id } }))
    let maxPoints = 0
    let userPoints = 0
    // calculate users points and the maximum for the objective
    filteredTasks.forEach((task) => {
      maxPoints += task.max_points * task.task_objective.multiplier
      const doneTask = userTasks.find(ut => ut.task_id === task.id)
      userPoints += doneTask ? doneTask.points * task.task_objective.multiplier : 0
    })
    return {
      objectiveId: objective.id,
      objectiveName: objective[`${lang}_name`],
      userPoints,
      maxPoints
    }
  }))
)

const calculateGradeDepth = (grade, gradeQualifies) => {
  const gradeWithDepth = { ...grade }
  let preReq = gradeWithDepth.prerequisiteId || undefined
  let depth = 0
  while (preReq !== undefined) {
    // increment recursion depth by one
    depth += 1
    // find the pre-requisite in the grade list and check if user qualifies for it
    const found = gradeQualifies.find(g => g.gradeId === preReq) // eslint-disable-line no-loop-func
    if (found && !found.qualifiedForGrade) {
      // If any prerequisite is not met, user does not earn the grade,
      // even if points otherwise would be enough
      gradeWithDepth.qualifiedForGrade = false
    }
    // go down the rabbit hole
    preReq = found.prerequisiteId || undefined
  }
  gradeWithDepth.depth = depth
  return gradeWithDepth
}

// TODO: Refactor. Needs possibly a separate file that contains all possible text variations.
const generateFeedback = (response, lang) => {
  if (!response.verification || !response.verification.categoryVerifications) return
  const { categoryVerifications } = response.verification
  // generate feedback for each category
  const feedbacks = categoryVerifications.map((category) => {
    const { categoryId, categoryName } = category
    // no feedback for categories with no tasks
    if (category.gradeQualifies.every(g => g.categoryPoints === 0)) {
      return {
        categoryId,
        categoryName,
        text: feedbackTextGenerator.generateCategoryText(true, 0, 0, lang),
        skillLevelObjectives: [],
        difference: 0,
        noFeedback: true
      }
    }
    return generateCategoryFeedback(category, lang)
  })
  // What is the "best" category? Emphasize that first
  let best = { amountDone: 0 }
  let worst = { amountDone: Infinity }
  let totalDone = 0
  let meanDiff = 0
  for (let i = 0; i < feedbacks.length; i += 1) {
    const category = feedbacks[i]
    // get the sum of done tasks
    const amountDone = amountsForCategory(category)
    if (!category.noFeedback) {
      totalDone += amountDone
      meanDiff += category.difference
      if (amountDone > best.amountDone) {
        best = { ...category, amountDone }
      }
      if (amountDone < worst.amountDone) {
        worst = { ...category, amountDone }
      }
    }
  }
  // Divide amounts to get percentages and mean,
  // remember exclude categories without feedback
  totalDone /= feedbacks.filter(f => !f.noFeedback).length
  meanDiff /= feedbacks.filter(f => !f.noFeedback).length
  // calculate the mean absolute difference
  const variance = feedbacks.reduce((acc, cur) => acc + ((cur.difference - meanDiff) ** 2), 0)
  const sd = Math.sqrt(variance / 1 - feedbacks.length)
  const describeAmount = (percentage) => {
    if (percentage < 30) return 'generalLittleDone'
    if (percentage < 70) return 'generalSomeDone'
    return 'generalLotDone'
  }
  // let generalFeedback = `Olet tehnyt ${describeAmount(totalDone)} töitä kurssilla tehtävien parissa. `
  // generalFeedback += ` Suhteessa eniten tehtäviä olet tehnyt osiosta ${best.categoryName}.`
  // generalFeedback += ` Enemmän sinun kannattaisi ehkä panostaa osion ${worst.categoryName} tehtäviin.`
  const describeAssessments = () => {
    // very good estimate
    if (Math.abs(meanDiff) < 1 && sd < 1) return 'generalGood'
    // generally under-estimating
    if (meanDiff <= -1) return 'generalLow'
    // generally over-estimating
    if (meanDiff >= 1) return 'generalHigh'
    // estimates all over the place?
    return 'generalInconsistent'
  }

  const generalFeedback = feedbackTextGenerator.generateGeneralText(
    !feedbacks.every(f => f.noFeedback),
    describeAmount(totalDone),
    best.categoryName, worst.categoryName,
    describeAssessments(),
    lang
  )
  return { generalFeedback, categoryFeedback: feedbacks }
}

const generateCategoryFeedback = (category, lang) => {
  // Filter gradeQualifies to represent different skill levels
  const { categoryId, categoryName, earnedGrade, wantedGrade } = category
  const skillLevelQualifies = category.gradeQualifies.filter(grade => (
    category.gradeQualifies.find(g => grade.skillLevelId === g.skillLevelId) === grade
  ))
  const skillLevelObjectives = skillLevelQualifies.map((skillLevel) => {
    // Simply get the percentages done of the category's objectives
    const objectives = skillLevel.objectivePoints.map(objective => ({
      name: objective.objectiveName,
      percentageDone: (objective.userPoints / objective.maxPoints * 100),
      // Small safety check: if the objective has no points to be gotten, don't display it
      include: objective.maxPoints > 0
    }))
    return { skillLevel: skillLevel.skillLevelName, objectives }
  })
  const earnedStats = category.gradeQualifies.find(grade => grade.gradeId === earnedGrade.gradeId)
  || { skillLevelId: 0 }
  const higherLevelTasksDone = skillLevelQualifies.filter(grade => (
    // does user not qualify for this grade, i.e. is not the earned grade or below it
    !grade.qualifiedForGrade
    && grade.skillLevelId !== earnedStats.skillLevelId
    // does user have points for this skill level
    && grade.userPoints > 0
    // filter out any duplicate stats for same skill level
    && category.gradeQualifies.find(g => grade.skillLevelId === g.skillLevelId) === grade
  ))
  // calculate percentages that for the earned grade and higher levels that user has done
  // const earnedPercentage = (earnedStats.userPoints * 100).toFixed(2) || null
  const extraDone = higherLevelTasksDone.map(level => (
    { skillLevel: level.skillLevelName, done: (level.userPoints * 100).toFixed(2) }
  ))
  // Check whether we are dealing with an accurate, humble or arrogant person
  // let text = ''
  // if (wantedGrade.id === earnedGrade.categoryGradeId) {
  //   // Assessment spot on!
  //   text += 'Arvioimasi arvosana on hyvin linjassa tekemiesi tehtävien kanssa. Hienoa! '
  // } else if (wantedGrade.difference > 0) {
  //   text += 'Arvioimasi arvosana on korkeampi kuin mitä tekemäsi tehtävät antaisivat olettaa. '
  //   // wants more than deserves
  //   // WHAT THE HELL YOU ARROGANT SHIT
  // } else {
  //   text += 'Arvioimasi arvosana on matalampi kuin mitä tekemäsi tehtävät antaisivat olettaa. '
  //   // wants less than deserves
  //   // such a humble man you are
  // }
  // if (extraDone.length > 0) {
  //   text += `Olet kuitenkin tehnyt tehtäviä korkeammilta taitotasoilta 
  //   ${extraDone.some(extra => extra.done > 50) ? 'paljon ' : 'jonkin verran'}, 
  //   joten on mahdollista, että arvosanasi tulisi olla korkeampi kuin mitä tämä laskenta osoittaa.`
  // }
  // text += ' Voit alta tarkastella suoritusmääriäsi kunkin tavoitetason kohdalla.'
  const done = () => {
    if (extraDone.length === 0) return 0
    return extraDone.some(extra => extra.done > 50) ? 2 : 1
  }
  const text = feedbackTextGenerator.generateCategoryText(
    true, wantedGrade.difference,
    done(extraDone),
    lang
  )
  return { categoryId, categoryName, text, skillLevelObjectives, difference: wantedGrade.difference, noFeedback: false }
}

const amountsForCategory = (category) => {
  const skillLevelAmounts = category.skillLevelObjectives.map(skillLevel => (
    skillLevel.objectives.reduce((acc, cur) => acc + (cur.percentageDone / skillLevel.objectives.length), 0)
  ))
  const total = skillLevelAmounts.reduce((acc, cur) => acc + cur, 0)
  return total
}

const getCourseInstanceId = async (id, responses = []) => {
  if (responses.length > 0) return responses[0].dataValues.self_assessment.course_instance_id
  const selfAssessment = await SelfAssessment.findById(id, {
    attributes: ['id', 'course_instance_id']
  })
  if (!selfAssessment) return null
  return selfAssessment.get({ plain: true }).course_instance_id
}

const getBySelfAssesment = async (id) => {
  const responses = await AssessmentResponse.findAll({
    attributes: ['id', 'response', 'person_id', 'self_assessment_id'],
    include: [
      {
        model: Person,
        attributes: ['id', 'studentnumber', 'name']
      },
      {
        model: SelfAssessment,
        where: {
          id
        },
        attributes: ['id', 'course_instance_id']
      }
    ]
  })
  return responses
}

// TODO: Avoid JSON conversion as much as possible.
const addGradesAndHeaders = async (assessmentResponses, courseInstanceId, lang) => {
  const grades = await gradeService.getByCourse(courseInstanceId, lang)
  const data = await Promise.all(assessmentResponses.map(async (rs) => {
    const r = rs.toJSON()
    return { ...r, response: await getGradesAndHeader(r.response, lang, grades) }
  }))
  return data
}

const swapHeaders = (data) => {
  const h = {}
  data.finalHeaders.forEach(finalH => h[finalH.type] = finalH.value) // eslint-disable-line
  return h
}

// TODO: Refactor this, it's pretty bad
const getGradesAndHeader = async (data, lang, grades) => {
  let { response } = data
  response = response || data
  grades = grades || await gradeService.getByCourse(response.course_instance_id, lang)
  // get the grades and map all grades from ids to values
  if (response.assessmentType !== 'objectives') {
    response.questionModuleResponses = response.questionModuleResponses.map(
      qmRes => ({ ...qmRes, grade: grades.find(g => g.id === qmRes.grade).name })
    )
  }
  const { grade } = response.finalGradeResponse

  // if we dont have a grade value for final grade, it didnt exist in the assessment so we can just return
  if (!grade) {
    return response
  }
  // ...else we get the correct header name by lang and change the final grade from id to value

  response.finalGradeResponse = { ...response.finalGradeResponse, grade: grades.find(g => g.id === grade).name }
  response.finalGradeResponse.name = response.finalGradeResponse.headers[`${lang}_name`]
  return response
}

module.exports = {
  getOne,
  create,
  generateFeedback,
  verifyAssessmentGrade,
  getCourseInstanceId,
  getBySelfAssesment,
  addGradesAndHeaders
}
