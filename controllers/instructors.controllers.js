const Instructor = require('../models/Instructor')
const User = require('../models/user')

const router = require('express').Router()

router.get('/', async (req, res) => {
    const instructors = await Instructor.find({ status: "active" })
    res.render('instructors/all-instructors.ejs', { instructors })
})

// New instructor form (admin)
router.get('/new', async (req, res) => {
    // show list of all users to display them in UI ti make them instructors
    const users = await User.find()
    res.render('instructors/create-instructors.ejs', { users })
})

// Create instructor (admin)
router.post('/', async (req, res) => {
    const {
        staffNumber,
        firstName,
        lastName,
        status,
        userId
    } = req.body

    await Instructor.create({
        user: userId,
        staffNumber,
        firstName,
        lastName,
        status,
    })

    res.redirect('/instructors')
})

// View instructor profile
router.get('/:id', async (req, res) => {
    const instructor = Instructor.findById(req.params.id)
    res.render('instructors/details-instructors.ejs', { instructor })
})

// Edit instructor form (admin)
router.get('/:id/edit', async (req, res) => {
    const instructor = Instructor.findById(req.params.id)
    res.render('instructors/edit-instructors.ejs', { instructor })
})

// Update instructor (admin)
router.put('/:id', async (req, res) => {
    const {
        firstName,
        lastName,
        status
    } = req.body

    await Instructor.findByIdAndUpdate(req.params.id, {
        firstName,
        lastName,
        status
    })

    res.redirect('/instructors')
})

router.delete('/:id', async (req, res) => {
    await Instructor.findByIdAndUpdate(req.params.id, {
        status: "inactive"
    })

    res.redirect('/instructors')
})

module.exports = router