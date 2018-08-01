const router = require('express').Router()

const typeService = require('../services/type_service.js')
const { checkPrivilege } = require('../services/privilege.js')
const globalMessages = require('../messages/global_messages.js')

const messages = {
  ...globalMessages,
  create: {
    success: {
      eng: '"Tyyppi luotu onnistuneesti." englanniksi.',
      fin: 'Tyyppi luotu onnistuneesti.',
      swe: '"Tyyppi luotu onnistuneesti." ruotsiksi.'
    }
  },
  delete: {
    success: {
      eng: '"Tyyppi poistettu onnistuneesti." englanniksi.',
      fin: 'Tyyppi poistettu onnistuneesti.',
      swe: '"Tyyppi poistettu onnistuneesti." ruotsiksi.'
    }
  },
  createHeader: {
    success: {
      eng: '"Tyyppiotsake luotu onnistuneesti." englanniksi.',
      fin: 'Tyyppiotsake luotu onnistuneesti.',
      swe: '"Tyyppiotsake luotu onnistuneesti." ruotsiksi.'
    }
  },
  deleteHeader: {
    success: {
      eng: '"Tyyppiotsake poistettu onnistuneesti." englanniksi.',
      fin: 'Tyyppiotsake poistettu onnistuneesti.',
      swe: '"Tyyppiotsake poistettu onnistuneesti." ruotsiksi.'
    }
  }
}

router.post('/create', async (req, res) => {
  const { instance: toCreate, header } = await typeService.create.prepare(req.body)
  if (!await checkPrivilege(
    req,
    [
      {
        key: 'logged_in'
      },
      {
        key: 'teacher_on_course',
        param: header.course_instance_id
      }
    ]
  )) {
    res.status(403).json({
      error: messages.privilege.failure[req.lang]
    })
    return
  }
  await typeService.create.execute(toCreate)
  const created = typeService.create.value(toCreate, req.lang)
  res.status(200).json({
    message: messages.create.success[req.lang],
    created
  })
})

router.delete('/:id', async (req, res) => {
  const toDelete = await typeService.delete.prepare(req.params.id)
  if (!toDelete) {
    res.status(404).json({
      error: messages.notfound.failure[req.lang]
    })
    return
  }
  if (!await checkPrivilege(
    req,
    [
      {
        key: 'logged_in'
      },
      {
        key: 'teacher_on_course',
        param: toDelete.dataValues.type_header.course_instance_id
      }
    ]
  )) {
    res.status(403).json({
      error: messages.privilege.failure[req.lang]
    })
    return
  }
  const deleted = typeService.delete.value(toDelete)
  typeService.delete.execute(toDelete)
  res.status(200).json({
    message: messages.delete.success[req.lang],
    deleted
  })
})

router.post('/headers/create', async (req, res) => {
  try {
    const toCreate = typeService.createHeader.prepare(req.body)
    if (!await checkPrivilege(
      req,
      [
        {
          key: 'logged_in'
        },
        {
          key: 'teacher_on_course',
          param: toCreate.dataValues.course_instance_id
        }
      ]
    )) {
      res.status(403).json({
        error: messages.privilege.failure[req.lang]
      })
      return
    }
    await typeService.createHeader.execute(toCreate)
    const created = typeService.createHeader.value(toCreate, req.lang)
    res.status(200).json({
      message: messages.createHeader.success[req.lang],
      created
    })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({
        error: e
      })
    } else {
      res.status(500).json({
        error: messages.unexpected.failure[req.lang]
      })
      console.log(e)
    }
  }
})

router.delete('/headers/:id', async (req, res) => {
  try {
    const toDelete = await typeService.deleteHeader.prepare(req.params.id)
    if (!await checkPrivilege(
      req,
      [
        {
          key: 'logged_in'
        },
        {
          key: 'teacher_on_course',
          param: toDelete.dataValues.course_instance_id
        }
      ]
    )) {
      res.status(403).json({
        error: messages.privilege.failure[req.lang]
      })
      return
    }
    const deleted = typeService.deleteHeader.value(toDelete)
    typeService.deleteHeader.execute(toDelete)
    res.status(200).json({
      message: messages.deleteHeader.success[req.lang],
      deleted
    })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({
        error: e
      })
    } else {
      res.status(500).json({
        error: messages.unexpected.failure[req.lang]
      })
      console.log(e)
    }
  }
})

module.exports = router
