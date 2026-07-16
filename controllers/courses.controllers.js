const router = require("express").Router()
const Course = require("../models/Course")
const Enrollment = require("../models/Enrollment")
const checkRole = require('../middleware/checkRole')
const isSignedIn = require("../middleware/is-signed-in")

router.get('/', async (req, res) => {
    // optional accept filters in query
    const courses = await Course.find()
    res.render('/courses/all-courses.ejs', { courses })
})

router.get('/new', checkRole("admin"), async (req, res) => {
    res.render('courses/create-courses.ejs')
})

router.post('/', isSignedIn, checkRole("admin"), async (req, res) => {
    const {
        code,
        name,
        description,
        credits,
        capacity,
        instructorId,
        isActive
    } = req.body

    await Course.create({
        code,
        name,
        description,
        credits,
        capacity,
        instructorId,
        isActive
    })

    res.redirect('/courses')
})

router.get('/:id', async (req, res) => {
    const course = await Course.findById(req.params.id)
    // show all students enrolled in courses, it will be used for instructor
    const enrollmentForCourse = await Enrollment.find({ course: req.params.id  })
    const students = enrollmentForCourse.map(enrollment => enrollment.student)

    res.render('courses/details-courses.ejs', { course, students })
})

router.get('/:id/edit', isSignedIn, checkRole("admin"), async (req, res) => {
    const course = await Course.findById(req.params.id)
    res.render('courses/edit-courses.ejs', { course })
})

router.put('/:id', isSignedIn, checkRole("admin"), async (req, res) => {
    const {
        code,
        name,
        description,
        credits,
        capacity,
        instructorId,
        isActive
    } = req.body

    const updated = await Course.findByIdAndUpdate(req.params.id, {
        code,
        name,
        description,
        credits,
        capacity,
        instructorId,
        isActive
    })

    res.redirect(`/courses`)
})

router.delete('/:id', isSignedIn, checkRole("admin"), async (req, res) => {
    // soft delete
    await Course.findByIdAndUpdate(req.params.id, {
        isActive: false
    })

    res.redirect('/courses')
})

module.exports = router;
