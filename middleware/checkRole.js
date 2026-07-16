function checkRole(role) {
    return function(req, res, next) {
        const user = req.session.user
        if (user && user.role !== role) {
            return res.send('Forbidden access')
        } else {
            return next()
        }
    }
}

module.exports = checkRole