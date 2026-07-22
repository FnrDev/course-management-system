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
    try {
        const courses = await Course.find().populate('instructor')
        const enrolledObj = await countEnrolledByCourse(courses.map(course => course._id))
        console.log({ courses, enrolled: enrolledObj })

        res.render('courses/all-courses.ejs', {
            courses,
            enrolled: enrolledObj
        })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.get('/new', isSignedIn, checkRole("admin"), async (req, res) => {
    try {
        const instructors = await Instructor.find({ status: 'active' }).sort({ firstName: 1 })
        console.log(instructors)
        res.render('courses/create-courses.ejs', { instructors })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.post('/', isSignedIn, checkRole("admin"), async (req, res) => {
    try {
        const {
            code,
            name,
            description,
            credits,
            capacity,
            instructor,
            isActive
        } = req.body

        const course = await Course.create({
            code,
            name,
            description,
            credits,
            capacity,
            instructor: instructor || undefined,
            isActive: isActive === 'on'
        })
        console.log(course)

        res.redirect('/courses')
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructor')
        console.log(course)

        if (!course) {
            return res.redirect('/courses')
        }

        const enrollmentRecords = await Enrollment.find({
            course: req.params.id,
            status: 'enrolled'
        }).lean()
        const enrollmentStudentIds = enrollmentRecords
            .map(enrollment => enrollment.student)
            .filter(Boolean)
        const rosterStudents = await Student.find({
            $or: [
                { _id: { $in: enrollmentStudentIds } },
                { user: { $in: enrollmentStudentIds } }
            ]
        }).lean()
        const studentsByReference = new Map()
        rosterStudents.forEach(student => {
            studentsByReference.set(String(student._id), student)
            if (student.user) {
                studentsByReference.set(String(student.user), student)
            }
        })
        const enrollments = enrollmentRecords.map(enrollment => ({
            ...enrollment,
            student: studentsByReference.get(String(enrollment.student)) || null
        }))
        console.log(enrollments)

        let myEnrollment = null
        if (req.session.user && req.session.user.role === 'student') {
            const me = await Student.findOne({ user: req.session.user._id })
            console.log(me)
            const studentIds = me
                ? [req.session.user._id, me._id]
                : [req.session.user._id]

            myEnrollment = await Enrollment.findOne({
                course: req.params.id,
                status: 'enrolled',
                student: { $in: studentIds }
            })
            console.log(myEnrollment)
        }

        res.render('courses/details-courses.ejs', {
            course,
            enrollments,
            enrolledCount: enrollments.length,
            myEnrollment
        })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.get('/:id/edit', isSignedIn, checkRole("admin"), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
        console.log(course)

        if (!course) {
            return res.redirect('/courses')
        }

        const instructors = await Instructor.find({ status: 'active' }).sort({ firstName: 1 })
        console.log(instructors)
        res.render('courses/edit-courses.ejs', { course, instructors })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.put('/:id', isSignedIn, checkRole("admin"), async (req, res) => {
    try {
        const {
            code,
            name,
            description,
            credits,
            capacity,
            instructor,
            isActive
        } = req.body

        const course = await Course.findByIdAndUpdate(req.params.id, {
            code,
            name,
            description,
            credits,
            capacity,
            instructor: instructor || null,
            isActive: isActive === 'on'
        })
        console.log(course)

        res.redirect(`/courses/${req.params.id}`)
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.delete('/:id', isSignedIn, checkRole("admin"), async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, {
            isActive: false
        })
        console.log(course)

        res.redirect('/courses')
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

module.exports = router;
