const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const bcrypt = require("bcrypt");

router.get("/sign-up", (req, res) => {
  try {
    res.render("auth/sign-up.ejs");
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.post("/sign-up", async (req, res) => {
  try {
    const userInDatabase = await User.findOne({ email: req.body.email });
    console.log(userInDatabase ? { id: userInDatabase._id, email: userInDatabase.email } : null);
    if (userInDatabase) {
      return res.send("Username already taken.");
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.send("Password and Confirm Password must match");
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = hashedPassword;

    const user = await User.create({ ...req.body, last_login_at: new Date() });
    console.log({ id: user._id, email: user.email, role: user.role });
    res.redirect("/auth/sign-in");
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.get("/sign-in", (req, res) => {
  try {
    res.render("auth/sign-in.ejs");
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.post("/sign-in", async (req, res) => {
  try {
    const userInDatabase = await User.findOne({ email: req.body.email });
    console.log(userInDatabase ? {
      id: userInDatabase._id,
      email: userInDatabase.email,
      role: userInDatabase.role
    } : null);
    if (!userInDatabase) {
      return res.send("Login failed. Please try again.");
    }

    const validPassword = bcrypt.compareSync(
      req.body.password,
      userInDatabase.password
    );
    if (!validPassword) {
      return res.send("Login failed. Please try again.");
    }

    req.session.user = userInDatabase

    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.get("/sign-out", (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
