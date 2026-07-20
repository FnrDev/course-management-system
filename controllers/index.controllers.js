const router = require("express").Router()

router.get('/', (req, res) => {
    try {
        res.render('homepage.ejs')
    } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong')
    }
})
module.exports = router;
