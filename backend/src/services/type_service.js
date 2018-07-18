const { Type, TaskType } = require('../database/models.js')

const create = async (data, lang) => {
  const value = (await Type.create(data)).toJSON()
  const name = value[`${lang}_name`]
  return {
    id: value.id,
    name,
    multiplier: value.multiplier
  }
}

const deleteType = async (id) => {
  const typeToDelete = await Type.findById(id, {
    include: {
      model: TaskType,
      attributes: ['task_id']
    }
  })
  const taskIds = typeToDelete.task_types.map(taskType => taskType.task_id)
  typeToDelete.destroy()
  return {
    id,
    task_ids: taskIds
  }
}

module.exports = {
  create,
  delete: deleteType
}