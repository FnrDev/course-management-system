const router = require("express").Router()
const Course = require("../models/Course")
const Enrollment = require("../models/Enrollment")
const Instructor = require("../models/Instructor")
const Prerequisite = require("../models/Prerequisite")
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

function normalizePrerequisiteIds(value, courseId) {
    const prerequisiteIds = Array.isArray(value) ? value : value ? [value] : []

    return [...new Set(prerequisiteIds)]
        .filter(prerequisiteId => prerequisiteId !== String(courseId || ''))
}

async function getValidPrerequisiteIds(value, courseId) {
    const prerequisiteIds = normalizePrerequisiteIds(value, courseId)
    const courses = await Course.find({
        _id: { $in: prerequisiteIds },
        isActive: true
    }).select('_id')

    return courses.map(course => course._id)
}

async function replacePrerequisites(courseId, prerequisiteIds) {
    await Prerequisite.deleteMany({ course: courseId })

    if (prerequisiteIds.length > 0) {
        await Prerequisite.insertMany(prerequisiteIds.map(prerequisiteCourse => ({
            course: courseId,
            prerequisiteCourse
        })))
    }
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
        const [instructors, prerequisiteCourses] = await Promise.all([
            Instructor.find({ status: 'active' }).sort({ firstName: 1 }),
            Course.find({ isActive: true }).sort({ code: 1 })
        ])
        console.log({ instructors, prerequisiteCourses })
        res.render('courses/create-courses.ejs', { instructors, prerequisiteCourses })
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
            isActive,
            prerequisites
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
        const prerequisiteIds = await getValidPrerequisiteIds(prerequisites, course._id)
        await replacePrerequisites(course._id, prerequisiteIds)
        console.log({ course, prerequisiteIds })

        res.redirect('/courses')
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('instructor')

        if (!course) {
            return res.redirect('/courses')
        }

        const prerequisiteRecords = await Prerequisite.find({ course: course._id })
            .populate('prerequisiteCourse')
        const prerequisites = prerequisiteRecords
            .map(record => record.prerequisiteCourse)
            .filter(Boolean)
            .sort((first, second) => first.code.localeCompare(second.code))
        console.log({ course, prerequisites })

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
        let missingPrerequisites = []
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

            if (!myEnrollment && prerequisites.length > 0) {
                const completedCourseIds = await Enrollment.find({
                    student: { $in: studentIds },
                    course: { $in: prerequisites.map(prerequisite => prerequisite._id) },
                    status: 'completed'
                }).distinct('course')
                const completedCourses = new Set(completedCourseIds.map(String))
                missingPrerequisites = prerequisites.filter(
                    prerequisite => !completedCourses.has(String(prerequisite._id))
                )
                console.log({ completedCourseIds, missingPrerequisites })
            }
        }

        res.render('courses/details-courses.ejs', {
            course,
            enrollments,
            enrolledCount: enrollments.length,
            myEnrollment,
            prerequisites,
            missingPrerequisites
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

        const [instructors, prerequisiteCourses, prerequisiteRecords] = await Promise.all([
            Instructor.find({ status: 'active' }).sort({ firstName: 1 }),
            Course.find({ _id: { $ne: course._id }, isActive: true }).sort({ code: 1 }),
            Prerequisite.find({ course: course._id })
        ])
        const selectedPrerequisiteIds = prerequisiteRecords.map(record => String(record.prerequisiteCourse))
        console.log({ instructors, prerequisiteCourses, selectedPrerequisiteIds })
        res.render('courses/edit-courses.ejs', {
            course,
            instructors,
            prerequisiteCourses,
            selectedPrerequisiteIds
        })
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
            isActive,
            prerequisites
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

        if (!course) {
            return res.redirect('/courses')
        }

        const prerequisiteIds = await getValidPrerequisiteIds(prerequisites, req.params.id)
        await replacePrerequisites(req.params.id, prerequisiteIds)
        console.log({ course, prerequisiteIds })

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
