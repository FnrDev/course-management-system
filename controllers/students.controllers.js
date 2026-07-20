const checkRole = require('../middleware/checkRole');
const Student = require('../models/Student')
const Enrollment = require('../models/Enrollment')

const router = require('express').Router()

// List all students (admin)
router.get('/', checkRole("admin"), async (req, res) => {
    const students = await Student.find();
    res.render('students/all-students.ejs', { students })
})

router.get('/:id', async (req, res) => {
    const student = await Student.findById(req.params.id)
    const courses = await Enrollment.find({ student: student._id, status: 'enrolled' }).populate('course')
    res.render('students/details-student.ejs', { student, courses })
})

// I know we can edit any user just by changing id
router.get('/:id/edit', async (req, res) => {
    const student = await Student.findById(req.params.id)
    res.render('students/edit-student.ejs', { student })
})

// I know we can edit any user just by changing id
router.put('/:id', async (req, res) => {
    const {
        firstName,
        lastName,
        status
    } = req.body;

    await Student.findByIdAndUpdate(req.params.id, {
        firstName,
        lastName,
        status
    })

    res.redirect('/students')
})

router.delete('/:id', checkRole("admin"), async (req, res) => {
    await Student.findByIdAndUpdate(req.params.id, {
        status: 'inactive'
    })
})


module.exports = router