const mongoose = require('mongoose')

const prerequisiteSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    prerequisiteCourse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    }
}, { timestamps: true })

prerequisiteSchema.index(
    { course: 1, prerequisiteCourse: 1 },
    { unique: true }
)

const Prerequisite = mongoose.model('Prerequisite', prerequisiteSchema)

module.exports = Prerequisite
