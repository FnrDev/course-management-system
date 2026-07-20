const checkRole = require('../middleware/checkRole');
const Student = require('../models/Student')
const Enrollment = require('../models/Enrollment')

const router = require('express').Router()

router.get('/', checkRole("admin"), async (req, res) => {
    try {
        const students = await Student.find();
        console.log(students)
        res.render('students/all-students.ejs', { students })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.get('/new', checkRole("admin"), async (req, res) => {
    try {
        const { firstName, lastName, status } = req.body;

        const student = await Student.create({
            firstName,
            lastName,
            status
        })
        console.log(student)

        return res.redirect('/students')
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
        console.log(student)
        const courses = await Enrollment.find({ student: student._id, status: 'enrolled' }).populate('course')
        console.log(courses)
        res.render('students/details-student.ejs', { student, courses })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.get('/:id/edit', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
        console.log(student)
        res.render('students/edit-student.ejs', { student })
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.put('/:id', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            status
        } = req.body;

        const student = await Student.findByIdAndUpdate(req.params.id, {
            firstName,
            lastName,
            status
        })
        console.log(student)

        res.redirect('/students')
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

router.delete('/:id', checkRole("admin"), async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, {
            status: 'inactive'
        })
        console.log(student)
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})

module.exports = router
