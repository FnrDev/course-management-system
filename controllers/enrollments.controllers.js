const checkRole = require('../middleware/checkRole')
const Enrollment = require('../models/Enrollment')
const Student = require('../models/Student')

const router = require('express').Router()

// My enrollments (student)
router.get('/', checkRole("student"), async (req, res) => {
    const myEnrollment = await Enrollment.find({ student: req.session.user._id })
    res.render('enrollments/my-enrollment.ejs', { myEnrollment })
})

// Enroll in course (student)
router.post('/:courseId', checkRole("student"), async (req, res) => {
    const currentStudent = await Student.findOne({ user: req.session.user._id })
    await Enrollment.create({
        course: req.params.courseId,
        status: 'enrolled',
        enrolledAt: new Date(),
        student: currentStudent._id
    })

    res.redirect('/enrollments')
})

// Drop course (student)
router.delete('/:id', checkRole("student"), async (req, res) => {
    await Enrollment.findByIdAndUpdate(req.params.id, {
        status: 'dropped',
        droppedAt: new Date()
    })
})

// Grade entry form (instructor)
router.get('/:id/grade', checkRole("instructor"), async (req, res) => {
    res.render('enrollments/enrollment-grade.ejs')
})

router.put('/:id/grade', checkRole("instructor"), async (req, res) => {
    const { grade } = req.body

    await Enrollment.findByIdAndUpdate(req.params.id, {
        grade,
        gradedAt: new Date(),
        gradedBy: req.session.user._id
    })

    res.redirect('/enrollments')
})

module.exports = router