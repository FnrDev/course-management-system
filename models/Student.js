const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
    studentNumber: {
        type: Number,
        unique: true,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        // active: Currently enrolled, can register for courses
        // inactive: Temporarily not studying (leave of absence, deferral)
        // graduated: Completed program, records retained
        // withdrawn: Left without completing
        enum: ['active', 'inactive', 'graduated', 'withdrawn']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

const Student = mongoose.model('Student', studentSchema)

module.exports = Student