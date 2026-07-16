const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 100
    },
    description: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 100
    },
    credits: {
        type: Number,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    enrolledCount: {
        type: Number
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Instructor"
    },
    isActive: {
        type: Boolean,
        default: true
    },
}, { timestamps: true })

const Course = mongoose.model('Course', courseSchema)

module.exports = Course