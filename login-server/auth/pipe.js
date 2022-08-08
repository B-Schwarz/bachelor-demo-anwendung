const {User} = require("../db/models/user.model")
const {Login} = require("../db/models/loginSession.model");

const LoginRequestEnum = {
    PASSWORD: 1,
    FIDO2: 2,
    TWOFACTOR: 3
}

const loginRequest = async (loginReq, user, req, res) => {

    if (!req.session.login && user) {
        req.session.login = await user.generateLoginSession()
        req.session.save()
        req.user = user
    } else if (req.session.login) {
        Login.findOne({
            "loginSession.token": req.session.login
        }).then(login => {
            if (!login) {
                req.session.destroy()
            }
        })
            .catch(() => req.session.destroy())
    }

    switch (loginReq) {
        case LoginRequestEnum.PASSWORD:
            await handlePassword(req, res)
            break
        case LoginRequestEnum.FIDO2:
            await handleFido2(req, res)
            break
        case LoginRequestEnum.TWOFACTOR:
            await handle2FA(req, res)
            break
    }

}

const sendConfirmation = async (user, req, res) => {
    req.session.token = await user.generateSession();
    req.session.userid = user._id

    req.session.save()
    res.sendStatus(200)
}

const handlePassword = async (req, res) => {
    const user = req.user
    Login.findOne({
        "loginSession.token": req.session.login
    }).then(async (login) => {
        if (login) {
            const requireFido2 = user.login.fido2 && !login.loginSession.completed.fido2

            const require2FA = user.login.twofactor && !login.loginSession.completed.twofactor
            login.loginSession.createdAt = new Date()
            login.loginSession.completed.password = true

            login.save()

            if (requireFido2) {
                res.send({
                    "next": "FIDO2"
                })
            } else if (require2FA) {
                res.send({
                    "next": "2FA"
                })
            } else {
                await sendConfirmation(user, req, res)
            }
        } else {
            res.sendStatus(401)
        }
    })
        .catch((e) => {
            console.log(e)
            res.sendStatus(401)
        })
}

const handleFido2 = async (req, res) => {
    const user = req.user
    Login.findOne({
        "loginSession.token": req.session.login
    }).then(async login => {
        if (login) {
            const requirePass = user.login.password && !login.loginSession.completed.password
            const require2FA = user.login.twofactor && !login.loginSession.completed.twofactor

            login.loginSession.createdAt = new Date()
            login.loginSession.completed.fido2 = true
            login.save()

            if (requirePass) {
                res.send({
                    "next": "Password"
                })
            } else if (require2FA) {
                res.send({
                    "next": "2FA"
                })
            } else {
                await sendConfirmation(user, req, res)
            }
        } else {
            res.sendStatus(401)
        }
    })
        .catch(() => {
            res.sendStatus(401)
        })
}

const handle2FA = async (req, res) => {
    const user = req.user
    Login.findOne({
        "loginSession.token": req.session.login
    }).then(async login => {
        if (login) {
            const requireFido2 = user.login.fido2 && !login.loginSession.completed.fido2
            const requirePass = user.login.twofactor && !login.loginSession.completed.password

            login.loginSession.createdAt = new Date()
            login.loginSession.completed.twofactor = true
            login.save()

            if (requirePass) {
                res.send({
                    "next": "Password"
                })
            } else if (requireFido2) {
                res.send({
                    "next": "Fido2"
                })
            } else {
                await sendConfirmation(user, req, res)
            }
        } else {
            res.sendStatus(401)
        }
    })
        .catch(() => {
            res.sendStatus(401)
        })
}

module.exports = {
    loginRequest,
    LoginRequestEnum
}
