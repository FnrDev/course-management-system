const checkRole = require('../middleware/checkRole')
const isSignedIn = require('../middleware/is-signed-in')
const Course = require('../models/Course')
const Instructor = require('../models/Instructor')
const User = require('../models/user')

const router = require('express').Router()

async function countEnrolledByCourse(courseIds) {
    const rows = await Enrollment.aggregate([
        { $match: { course: { $in: courseIds }, status: 'enrolled' } },
        { $group: { _id: '$course', total: { $sum: 1 } } }
    ])

    const counts = {}
    rows.forEach(row => { counts[row._id] = row.total })
    return counts
}

router.get('/', async (req, res) => {
    const instructors = await Instructor.find({ status: "active" })
    res.render('instructors/all-instructors.ejs', { instructors })
})

// New instructor form (admin)
router.get('/new', isSignedIn, checkRole("admin"), async (req, res) => {
    // show list of all users to display them in UI ti make them instructors
    const users = await User.find()
    res.render('instructors/create-instructors.ejs', { users })
})

// Create instructor (admin)
router.post('/', isSignedIn, checkRole("admin"), async (req, res) => {
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
    const instructor = await Instructor.findById(req.params.id)
    const coursesEnrolled = await Course.find({ instructor: instructor._id, isActive: true })
    res.render('instructors/details-instructors.ejs', { instructor, courses: coursesEnrolled })
})

// Edit instructor form (admin)
router.get('/:id/edit', isSignedIn, checkRole("admin"), async (req, res) => {
    const instructor = Instructor.findById(req.params.id)
    res.render('instructors/edit-instructors.ejs', { instructor })
})

// Update instructor (admin)
router.put('/:id', isSignedIn, checkRole("admin"), async (req, res) => {
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

// Delete instructor (admin)
router.delete('/:id', isSignedIn, checkRole("admin"), async (req, res) => {
    await Instructor.findByIdAndUpdate(req.params.id, {
        status: "inactive"
    })

    res.redirect('/instructors')
})

module.exports = router