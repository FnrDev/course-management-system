const Enrollment = require('../models/Enrollment')
const Student = require('../models/Student')

const router = require('express').Router()

router.get('/', async (req, res) => {
    const myEnrollment = await Enrollment.find({ student: req.session.user._id })
    res.render('enrollments/my-enrollment.ejs', { myEnrollment })
})

router.post('/:courseId', async (req, res) => {
    const currentStudent = await Student.findOne({ user: req.session.user._id })
    await Enrollment.create({
        course: req.params.courseId,
        status: 'enrolled',
        enrolledAt: new Date(),
        student: currentStudent._id
    })

    res.redirect('/enrollments')
})

// drop course for student
router.delete('/:id', async (req, res) => {
    await Enrollment.findByIdAndUpdate(req.params.id, {
        status: 'dropped',
        droppedAt: new Date()
    })
})

// Grade entry form (instructor)
router.get('/:id/grade', async (req, res) => {
    res.render('enrollments/enrollment-grade.ejs')
})

router.put('/:id/grade', async (req, res) => {
    const { grade } = req.body

    await Enrollment.findByIdAndUpdate(req.params.id, {
        grade,
        gradedAt: new Date(),
        gradedBy: req.session.user._id
    })

    res.redirect('/enrollments')
})

module.exports = router