const mongoose = require('mongoose')

const enrollmentSchema = new mongoose.Schema({
    status: {
        type: String,
        // enrolled: Actively registered, appears in schedule and instructor's roster
        // dropped: Student withdrew; dropped_at set, excluded from enrolled_count
        // completed: Course finished, final grade recorded
        enum: ['enrolled', 'dropped', 'completed']  
    },
    grade: {
        type: String
    },
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor"
    },
    gradedAt: {
        type: Date
    },
    enrolledAt: {
        type: Date
    },
    droppedAt: {
        type: Date
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }
})

const Enrollment = mongoose.model('Enrollment', enrollmentSchema)

module.exports = Enrollment