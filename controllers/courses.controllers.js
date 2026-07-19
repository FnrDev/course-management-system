const router = require("express").Router()
const Course = require("../models/Course")
const Enrollment = require("../models/Enrollment")
const Instructor = require("../models/Instructor")
const Student = require("../models/Student")
const checkRole = require('../middleware/checkRole')
const isSignedIn = require("../middleware/is-signed-in")

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
    const courses = await Course.find().populate('instructor')
    console.log(courses)
    const enrolledObj = await countEnrolledByCourse(courses.map(course => course._id))
    const enrollCount = Object.keys(enrolledObj).length ? enrolledObj : 0

    res.render('courses/all-courses.ejs', {
        courses,
        enrolled: enrollCount
    })
})

router.get('/new', isSignedIn, checkRole("admin"), async (req, res) => {
    const instructors = await Instructor.find({ status: 'active' }).sort({ firstName: 1 })
    res.render('courses/create-courses.ejs', { instructors })
})

router.post('/', isSignedIn, checkRole("admin"), async (req, res) => {
    const {
        code,
        name,
        description,
        credits,
        capacity,
        instructor,
        isActive
    } = req.body

    await Course.create({
        code,
        name,
        description,
        credits,
        capacity,
        instructor: instructor || undefined,
        isActive: isActive === 'on'
    })

    res.redirect('/courses')
})

router.get('/:id', async (req, res) => {
    const course = await Course.findById(req.params.id).populate('instructor')

    if (!course) {
        return res.redirect('/courses')
    }

    // roster for this course, shown to the instructor and admin
    const enrollments = await Enrollment.find({
        course: req.params.id,
        status: 'enrolled'
    }).populate('student')

    // has the signed-in student already taken a seat?
    let myEnrollment = null
    if (req.session.user && req.session.user.role === 'student') {
        const me = await Student.findOne({ user: req.session.user._id })
        if (me) {
            myEnrollment = enrollments.find(enrollment =>
                enrollment.student && enrollment.student._id.equals(me._id)
            )
        }
    }

    res.render('courses/details-courses.ejs', {
        course,
        enrollments,
        enrolledCount: enrollments.length,
        myEnrollment
    })
})

router.get('/:id/edit', isSignedIn, checkRole("admin"), async (req, res) => {
    const course = await Course.findById(req.params.id)

    if (!course) {
        return res.redirect('/courses')
    }

    const instructors = await Instructor.find({ status: 'active' }).sort({ firstName: 1 })
    res.render('courses/edit-courses.ejs', { course, instructors })
})

router.put('/:id', isSignedIn, checkRole("admin"), async (req, res) => {
    const {
        code,
        name,
        description,
        credits,
        capacity,
        instructor,
        isActive
    } = req.body

    await Course.findByIdAndUpdate(req.params.id, {
        code,
        name,
        description,
        credits,
        capacity,
        instructor: instructor || null,
        isActive: isActive === 'on'
    })

    res.redirect(`/courses/${req.params.id}`)
})

router.delete('/:id', isSignedIn, checkRole("admin"), async (req, res) => {
    // soft delete
    await Course.findByIdAndUpdate(req.params.id, {
        isActive: false
    })

    res.redirect('/courses')
})

module.exports = router;
