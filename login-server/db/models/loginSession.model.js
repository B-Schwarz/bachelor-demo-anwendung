const mongoose = require("mongoose")

const LoginSchema = new mongoose.Schema({
    userID: {
      type: String
    },
    loginSession: {
        token: {
            type: String,
            unique: true
        },
        createdAt: {
            type: Date
        },
        completed: {
            password: {
                type: Boolean,
                default: false
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
    }
});

// TTL For login session
LoginSchema.index({
    "loginSession.createdAt": 1
}, {
    expireAfterSeconds: 120
})

//Create Model
const Login = mongoose.model('Login', LoginSchema);

//Export Model
module.exports = { Login };
