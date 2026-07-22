const checkRole = require('../middleware/checkRole')
const Enrollment = require('../models/Enrollment')
const Student = require('../models/Student')
const User = require('../models/User')

const router = require('express').Router()

router.get('/', checkRole("student"), async (req, res) => {
    try {
        const myEnrollment = await Enrollment.find({ student: req.session.user._id })
        console.log(myEnrollment)
        res.render('enrollments/my-enrollment.ejs', { myEnrollment })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.post('/:courseId', checkRole("student"), async (req, res) => {
    try {
        const enrollment = await Enrollment.create({
            course: req.params.courseId,
            status: 'enrolled',
            enrolledAt: new Date(),
            student: req.session.user._id
        })
        console.log(enrollment)

        res.redirect('/enrollments')
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.delete('/:id', checkRole("student"), async (req, res) => {
    try {
        const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, {
            status: 'dropped',
            droppedAt: new Date()
        })
        console.log(enrollment)
        return res.redirect('/enrollments')
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.get('/:id/grade', checkRole("instructor"), async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id)
            .populate('student')
            .populate('course')
        console.log(enrollment)

        if (!enrollment || !enrollment.student || !enrollment.course) {
            return res.redirect('/courses')
        }

        res.render('enrollments/enrollment-grade.ejs', { enrollment })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.put('/:id/grade', checkRole("instructor"), async (req, res) => {
    try {
        const { grade } = req.body

        const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, {
            grade,
            gradedAt: new Date(),
            gradedBy: req.session.user._id
        })
        console.log(enrollment)

        if (!enrollment) {
            return res.redirect('/courses')
        }

        res.redirect(`/courses/${enrollment.course}`)
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

module.exports = router
