const checkRole = require('../middleware/checkRole')
const Course = require('../models/Course')
const Enrollment = require('../models/Enrollment')
const Prerequisite = require('../models/Prerequisite')
const Student = require('../models/Student')

const router = require('express').Router()

router.get('/', checkRole("student"), async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.session.user._id })
        const studentIds = student
            ? [req.session.user._id, student._id]
            : [req.session.user._id]
        const myEnrollment = await Enrollment.find({
            student: { $in: studentIds },
            status: 'enrolled'
        })
            .populate({
                path: 'course',
                populate: { path: 'instructor' }
            })
            .sort({ enrolledAt: -1 })
        console.log(myEnrollment)
        res.render('enrollments/my-enrollment.ejs', { myEnrollment })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.post('/:courseId', checkRole("student"), async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.session.user._id })
        const studentIds = student
            ? [req.session.user._id, student._id]
            : [req.session.user._id]
        const course = await Course.findById(req.params.courseId)

        if (!course || !course.isActive) {
            return res.redirect('/courses')
        }

        const prerequisiteRecords = await Prerequisite.find({ course: course._id })
        const prerequisiteCourseIds = prerequisiteRecords.map(record => record.prerequisiteCourse)
        const completedCourseIds = await Enrollment.find({
            student: { $in: studentIds },
            course: { $in: prerequisiteCourseIds },
            status: 'completed'
        }).distinct('course')
        const completedCourses = new Set(completedCourseIds.map(String))
        const hasMissingPrerequisites = prerequisiteCourseIds.some(
            prerequisiteCourseId => !completedCourses.has(String(prerequisiteCourseId))
        )
        console.log({ course, prerequisiteCourseIds, completedCourseIds })

        if (hasMissingPrerequisites) {
            return res.redirect(`/courses/${course._id}`)
        }

        const existingEnrollment = await Enrollment.findOne({
            course: req.params.courseId,
            status: 'enrolled',
            student: { $in: studentIds }
        })
        console.log(existingEnrollment)

        if (existingEnrollment) {
            return res.redirect(`/courses/${req.params.courseId}`)
        }

        const enrollment = await Enrollment.create({
            course: req.params.courseId,
            status: 'enrolled',
            enrolledAt: new Date(),
            student: student ? student._id : req.session.user._id
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
