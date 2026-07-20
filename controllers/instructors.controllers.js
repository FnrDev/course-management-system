const checkRole = require('../middleware/checkRole')
const isSignedIn = require('../middleware/is-signed-in')
const Course = require('../models/Course')
const Instructor = require('../models/Instructor')
const User = require('../models/User')

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
    try {
        const instructors = await Instructor.find({ status: "active" })
        console.log(instructors)
        res.render('instructors/all-instructors.ejs', { instructors })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.get('/new', isSignedIn, checkRole("admin"), async (req, res) => {
    try {
        const users = await User.find()
        console.log(users.map(user => ({
            id: user._id,
            email: user.email,
            role: user.role
        })))
        res.render('instructors/create-instructors.ejs', { users })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.post('/', isSignedIn, checkRole("admin"), async (req, res) => {
    try {
        const {
            staffNumber,
            firstName,
            lastName,
            status,
            userId
        } = req.body

        const instructor = await Instructor.create({
            user: userId,
            staffNumber,
            firstName,
            lastName,
            status,
        })
        console.log(instructor)

        res.redirect('/instructors')
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.get('/:id', async (req, res) => {
    try {
        const instructor = await Instructor.findById(req.params.id)
        console.log(instructor)
        const coursesEnrolled = await Course.find({ instructor: instructor._id, isActive: true })
        console.log(coursesEnrolled)
        res.render('instructors/details-instructors.ejs', { instructor, courses: coursesEnrolled })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.get('/:id/edit', isSignedIn, checkRole("admin"), async (req, res) => {
    try {
        const instructor = await Instructor.findById(req.params.id)
        console.log(instructor)
        res.render('instructors/edit-instructors.ejs', { instructor })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.put('/:id', isSignedIn, checkRole("admin"), async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            status
        } = req.body

        const instructor = await Instructor.findByIdAndUpdate(req.params.id, {
            firstName,
            lastName,
            status
        })
        console.log(instructor)

        res.redirect('/instructors')
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.delete('/:id', isSignedIn, checkRole("admin"), async (req, res) => {
    try {
        const instructor = await Instructor.findByIdAndUpdate(req.params.id, {
            status: "inactive"
        })
        console.log(instructor)

        res.redirect('/instructors')
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

module.exports = router
