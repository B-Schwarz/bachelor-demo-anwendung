const twofactor = require('node-2fa')
const {loginRequest} = require("./pipe");
const {LoginRequestEnum} = require("./pipe");

const twofactorGenerate = async (req, res) => {
    if (!req.user.twofactor.secret) {
        const newSecret = twofactor.generateSecret({
            account: req.user.name,
            name: "Bachelor Thesis Project"
        })

        req.user.twofactor = newSecret
        await req.user.save()

        res.send(newSecret)
    } else {
        res.sendStatus(400)
    }
}

const twofactorEnabled = async (req, res) => {
    if (req.user.twofactor.secret) {
        res.sendStatus(200)
    } else {
        res.sendStatus(404)
    }
}

const twofactorLogin = async (req, res) => {
    try {
        if (req.user.twofactor) {
            const d = twofactor.verifyToken(req.user.twofactor.secret, req.body.twofactor)

            if (d.delta === 0) {
                await loginRequest(LoginRequestEnum.TWOFACTOR, req.user, req, res)
            } else {
                res.status(401).send(d)
            }

        } else {
            res.sendStatus(400)
        }
    }catch (_) {
        res.sendStatus(400)
    }
}

module.exports = {
    twofactorGenerate,
    twofactorEnabled,
    twofactorLogin
}
