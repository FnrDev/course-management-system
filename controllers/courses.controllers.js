const router = require("express").Router()
const Course = require("../models/Course")
const Enrollment = require("../models/Enrollment")
const Instructor = require("../models/Instructor")
const Student = require("../models/Student")
const checkRole = require('../middleware/checkRole')
const isSignedIn = require("../middleware/is-signed-in")

// Live enrolled count per course, keyed by course id. The stored
// enrolledCount field goes stale as students drop, so it isn't used.
async function countEnrolledByCourse(courseIds) {
    const rows = await Enrollment.aggregate([
        { $match: { course: { $in: courseIds }, status: 'enrolled' } },
        { $group: { _id: '$course', total: { $sum: 1 } } }
    ])

    const counts = {}
    rows.forEach(row => { counts[row._id] = row.total })
    return counts
}

// List/search/filter all courses
router.get('/', async (req, res) => {
    const { q, instructor } = req.query

    const query = { isActive: true }

    if (q) {
        // match either the course name or its code, case-insensitively
        const search = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        query.$or = [{ name: search }, { code: search }]
    }

    if (instructor) {
        query.instructor = instructor
    }

    const courses = await Course.find(query).populate('instructor').sort({ code: 1 })
    const counts = await countEnrolledByCourse(courses.map(course => course._id))
    const instructors = await Instructor.find({ status: 'active' }).sort({ firstName: 1 })

    res.render('courses/all-courses.ejs', {
        courses,
        counts,
        instructors,
        filters: { q: q || '', instructor: instructor || '' }
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
