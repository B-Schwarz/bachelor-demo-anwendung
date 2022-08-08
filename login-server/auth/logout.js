const {User} = require("../db/models/user.model");

const logout = async (req, res) => {
    await User.updateOne({ _id: req.user._id }, {
        $pull: {
            session: { token: req.session.token }
        }
    })
    await req.user.save()

    req.session.destroy()
    res.sendStatus(200)
}

module.exports = {
    logout
}
