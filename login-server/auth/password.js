const { User } = require('../db/models/user.model')
const {loginRequest, LoginRequestEnum} = require("./pipe");

const registerPassword = async (req, res) => {
    let user, pass
    let abort = false

    try {
        user = req.body.username
        pass = req.body.password

        if (!user || !pass) {
            abort = true
        }
    } catch (e) {
        abort = true
    }

    if (!abort) {
        let newUser = new User({
            name: user,
            password: pass
        })

        await newUser.save()
            .then(() => {
                res.sendStatus(200)
            })
            .catch((e) => {
                console.log(e)
                res.sendStatus(500)
            })
    } else {
        res.sendStatus(400)
    }
}

const loginPassword = (req, res) => {
    let user, pass
    let abort = false

    try {
        user = req.body.username
        pass = req.body.password

        if (!user || !pass) {
            abort = true
        }
    } catch (e) {
        abort = true
    }

    if (!abort) {
        User.findByCredentials(user, pass)
            .then(async user => {
                if (user) {
                    await loginRequest(LoginRequestEnum.PASSWORD, user, req, res)
                } else {
                    res.sendStatus(401)
                }
            })
            .catch((e) => {
                console.log(e)
                res.sendStatus(401)
            })
    } else {
        res.sendStatus(400)
    }
}

module.exports = {
    loginPassword,
    registerPassword,
    LoginRequestEnum
}
