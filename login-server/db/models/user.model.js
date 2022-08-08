const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid');
const {Login} = require("./loginSession.model");
const {mongo} = require("mongoose");

//Define a schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        trim: true,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    session: [{
        token: {
            type: String
        }
    }],
    fido: [{
        key: {
            type: String,
            required: true
        },
        counter: {
            type: Number,
            required: true
        },
        guid: {
            type: String,
            required: true,
            trim: true
        },
        credId: {
            type: String,
            required: true
        }
    }],
    twofactor: {
        secret: {
            type: String
        },
        uri: {
            type: String,
            unique: true
        },
        qr: {
            type: String,
            unique: true
        }
    },
    login: {
        password: {
            type: Boolean,
            default: true
        },
        twofactor: {
            type: Boolean,
            default: false
        },
        fido2: {
            type: Boolean,
            default: false
        }
    }
});

UserSchema.pre('save', function (next) {
    let user = this
    let costFactor = 10

    if (user.isModified('password')) {
        user.password = bcrypt.hashSync(user.password, costFactor)
    }

    next()
})

UserSchema.methods.generateSession = async function () {
    const user = this

    const id = uuidv4()

    user.session.push({ token: id })
    await user.save()

    return id
}

UserSchema.methods.generateLoginSession = async function () {
    const user = this

    const id = uuidv4()

    const loginSess = new Login({
        userID: user._id,
        loginSession: {
            createdAt: new Date(),
            token: id
        }
    })

    await loginSess.save()

    return id
}

UserSchema.statics.findByCredentials = function (name, password) {
    let User = this;
    return User.findOne({
        name: {
            $regex: new RegExp(name, "i") // ignore case
        }
    }).then((user) => {
        if (!user)
            return Promise.reject();

        if (!user.login.password)
            return Promise.reject()

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) resolve(user);
                else reject();
            })
        })
    });
}



//Create Model
const User = mongoose.model('User', UserSchema);

//Export Model
module.exports = { User };
