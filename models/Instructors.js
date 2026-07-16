const mongoose = require('mongoose')

const instructorSchmea = new mongoose.Schema({
    staffNumber: {
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
        // active: Currently employed, can be assigned courses
        // inactive: Temporarily not teaching (sabbatical, leave)
        // former: No longer employed, kept for historical grade records
        enum: ['active', 'inactive', 'former']
    }
}, { timestamps: true })

const Instructor = mongoose.model('instructor', instructorSchmea)

module.exports = Instructor