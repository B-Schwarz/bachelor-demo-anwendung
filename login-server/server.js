const express = require('express')
const app = express()
const session = require('express-session')
const MongoStore = require('connect-mongo')
const https = require('https')
const fs = require('fs')
const {connectDB} = require('./db')
const {User} = require('./db/models/user.model')
const {loginPassword, registerPassword} = require('./auth/password')
const {logout} = require('./auth/logout')
const {registerFido, attestFido, assertFido, loginFido, fidoGetKeys, fidoDeleteKey} = require("./auth/fido2");
const {twofactorGenerate, twofactorEnabled, twofactorLogin} = require("./auth/2fa");
const {Login} = require("./db/models/loginSession.model");
const path = require("path");

//
//  CONFIG
//
const port = 4000;

app.use(express.json())
app.use(express.urlencoded({extended: false}));

app.disable('x-powered-by');

// CORS Header
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.CORS_URL);
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true")

    next();
});

const store = MongoStore.create({
    mongoUrl: process.env.DB_URI,
    collectionName: 'sessions'
})

const sess = session({
    name: 'session.sid',
    secret: 'supersafesecretnobodycanguess',
    saveUninitialized: false,
    resave: true,
    store: store,
    // proxy: (process.env.NODE_ENV === 'production'),
    cookie: {
        httpOnly: true,
        maxAge: 99999999999999,
        sameSite: 'lax',
        secure: (process.env.NODE_ENV === 'production')
    }
})

app.use(sess)

//
//  MIDDLEWARE
//

const isAuth = (req, res, next) => {
    if (req.session.token) {
        User.findOne({
            'session.token': req.session.token
        }).then(user => {
            if (user) {
                req.user = user
                next()
            } else {
                res.sendStatus(401)
            }
        })
    } else {
        res.sendStatus(401)
    }
}

const isLoggingIn = (req, res, next) => {
    if (req.session.login) {
        Login.findOne({
            'loginSession.token': req.session.login
        }).then(async user => {
            if (user) {
                req.user = await User.findOne({_id: user.userID})
                next()
            } else {
                res.session.destroy()
                res.sendStatus(401)
            }
        }).catch((e) => {
            req.session.destroy()
            res.sendStatus(500)
        })
    } else {
        next()
    }
}

//
//  API
//

app.get('/api/logout', isAuth, logout)

// Password
app.post('/api/pass/login', isLoggingIn, loginPassword)
app.post('/api/pass/register', registerPassword)

// FIDO2/WebAuthn

app.get('/api/fido/register', isAuth, attestFido)
app.post('/api/fido/register', isAuth, registerFido)

app.get('/api/fido/login', isLoggingIn, assertFido)
app.post('/api/fido/login', isLoggingIn, loginFido)

app.get('/api/fido/keys', isAuth, fidoGetKeys)
app.post('/api/fido/key', isAuth, fidoDeleteKey)

// 2FA

app.get('/api/2fa/generate', isAuth, twofactorGenerate)
app.get('/api/2fa/enabled', isAuth, twofactorEnabled)

app.post('/api/2fa/login', isLoggingIn, twofactorLogin)

// Authenticated Area

app.get('/api/me', isAuth, (req, res) => {
    res.sendStatus(200)
})

app.get('/api/me/login', isAuth, (req, res) => {
    res.send(req.user.login)
})

app.post('/api/me/login', isAuth, (req, res) => {
    try {
        const twofactor = Boolean(req.body.twofactor)
        const fido2 = Boolean(req.body.fido2)

        req.user.login.twofactor = twofactor
        req.user.login.fido2 = fido2

        req.user.save()

        res.sendStatus(200)
    } catch (_) {
        res.sendStatus(400)
    }
})

app.get('/secret', isAuth, (req, res) => {
    res.send('<html><body><h2>Dies ist eine geheime Seite</h2></body></html>')
})

//
//  HOST
//

if (process.env.NODE_ENV) {
    app.use(express.static(path.resolve('frontend')))
    app.get('*', (req, res) => {
        res.sendFile(path.resolve('frontend/index.html'))
    })
}

const start = async () => {
    try {
        await connectDB();
        await https.createServer({
            key: fs.readFileSync('cert.key'),
            cert: fs.readFileSync('cert.crt')
        }, app).listen(port);
    } catch (e) {
        console.log(e);
    }
}

start().then(() => {
    console.log(`Der Server wurde gestartet!`);
});
