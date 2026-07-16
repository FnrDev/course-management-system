const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin']
  },
  // this field will be used for soft delete
  is_active: {
    type: Boolean,
    default: true
  },
  last_login_at: {
    type: Date
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
