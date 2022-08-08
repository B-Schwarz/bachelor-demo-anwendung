const {Fido2Lib} = require("fido2-lib");
const {v4: uuidv4} = require('uuid');
const {bytesToBase64} = require("byte-base64");
const {User} = require("../db/models/user.model");
const {loginRequest} = require("./pipe");
const {LoginRequestEnum} = require("./pipe");

const challengeSize = 128

// Notes are taken from the docs at: https://webauthn-open-source.github.io/fido2-lib/Fido2Lib.html

const f2l = new Fido2Lib({
    timeout: 45000, // (45s) Time in ms until timeout
    rpId: process.env.FIDO_URL || "", // Name of the server
    rpName: "Bachelor Thesis", // Name of the server
    // rpIcon: "https://example.com/logo.png", -- Not Implemented
    challengeSize: challengeSize, // Number of bytes used for the challenge
    attestation: "direct", // Preferred attestation type. More details at: https://w3.org/TR/webauthn/#enumdef-attestationconveyancepreference
    cryptoParams: [-7, -257], // -7 -> ES256, -257 -> RS256
    excludeCredentials: [],
    // authenticatorSelectionCriteria: {}, -- Not implemented -> Would be an object for allowed authenticators
    authenticatorAttachment: "cross-platform", // Platform -> Authenticator is part of OS; Cross-Platform -> Roaming authenticators
    authenticatorRequireResidentKey: true, // Indicates whether the authenticator must store key internally
    authenticatorUserVerification: "preferred" // Indicates whether user verification should be performed ["required", "preferred", "discouraged"]
})

const str2ab = (str) => {
    let bufView = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return bufView;
}

const generateChallenge = () => {
    let challenge = ''
    let completed = false
    while (!completed) {
        challenge += uuidv4()
        if (challenge.length > challengeSize) {
            challenge = challenge.substring(0, challengeSize)
            completed = true
        }
    }
    return challenge
}

const generateExpectation = (challenge) => {
    return {
        challenge: str2ab(challenge),
        origin: process.env.ORIGIN_URL,
        factor: "either"
    }
}

const generateAssertion = (challenge, pubKey, counter, credId) => {
    return {
        challenge: str2ab(challenge),
        origin: process.env.ORIGIN_URL,
        factor: "either",
        publicKey: pubKey,
        prevCounter: counter,
        userHandle: str2ab(credId)
    }
}

const attestFido = async (req, res) => {
    const registrationOptions = await f2l.attestationOptions()

    // Add user id
    registrationOptions.user.id = req.session.userid
    registrationOptions.user.displayName = req.user.name
    registrationOptions.user.name = req.user.name

    // Generate and save challenge
    const challenge = generateChallenge()
    req.session.challenge = challenge
    registrationOptions.challenge = challenge

    // registrationOptions.authenticatorSelection = {
    //     residentKey: "discouraged"
    // }

    registrationOptions.extensions = {
        appidExclude: process.env.ORIGIN_URL,
        credProps: true
    }

    res.send(registrationOptions)
}

const registerFido = async (req, res) => {
    try {
        const clientResponse = req.body

        const clientResponseParse = {
            id: str2ab(clientResponse.id).buffer,
            rawId: clientResponse.rawId,
            response: {
                clientDataJSON: clientResponse.response.clientDataJSON,
                attestationObject: clientResponse.response.attestationObject
            }
        }

        if (clientResponseParse) {
            const expect = generateExpectation(String(req.session.challenge))
            const regResult = await f2l.attestationResult(clientResponseParse, expect)


            if (regResult.audit.complete) {
                req.user.fido.push({
                    key: regResult.authnrData.get('credentialPublicKeyPem'),
                    counter: regResult.authnrData.get('counter'),
                    guid: bytesToBase64(new Uint8Array(regResult.authnrData.get('aaguid'))),
                    credId: bytesToBase64(new Uint8Array(regResult.authnrData.get('credId')))
                })
                req.user.save()
                res.sendStatus(200)
            } else {
                res.sendStatus(401)
            }
        } else {
            res.sendStatus(400)
        }
    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
}

const assertFido = async (req, res) => {
    const authnOptions = await f2l.assertionOptions()

    const challenge = generateChallenge()
    req.session.challenge = challenge
    authnOptions.challenge = challenge

    authnOptions.extensions = {
        appid: process.env.ORIGIN_URL
    }

    res.send(authnOptions)
}

const loginFido = async (req, res) => {
    try {
        const clientResponse = req.body

        const clientResponseParse = {
            id: str2ab(clientResponse.id).buffer,
            response: {
                clientDataJSON: clientResponse.response.clientDataJSON,
                authenticatorData: clientResponse.response.authenticatorData,
                signature: str2ab(atob(clientResponse.response.signature)).buffer
            }
        }

        if (clientResponseParse) {
            const user = await User.find({
                "fido": {$exists: true}
            }, {"fido.key": 1, "fido.counter": 1, "fido.credId": 1})

            let success = false

            for (const u of user) {
                for (const k of u['fido']) {

                    try {
                        const expect = generateAssertion(String(req.session.challenge), k['key'], k['counter'], k['credId'])

                        const regResult = await f2l.assertionResult(clientResponseParse, expect)

                        if (regResult.audit.complete) {

                            success = true

                            User.findById(u['_id'])
                                .then(async user => {
                                    if (user) {
                                        for (const f of user.fido) {
                                            if (f.key === k['key']) {
                                                f.counter = regResult.authnrData.get('counter')
                                            }
                                        }

                                        await loginRequest(LoginRequestEnum.FIDO2, user, req, res)
                                    } else {
                                        res.sendStatus(401)
                                    }
                                })

                            break
                        }
                    } catch (_) {
                        /* ignore this occurs if the signature is wrong */
                    }
                }
            }

            if (!success) {
                res.sendStatus(401)
            }
        } else {
            res.sendStatus(400)
        }
    } catch (e) {
        console.log(e)
        res.sendStatus(500)
    }
}

const fidoGetKeys = async (req, res) => {
    const keys = req.user.fido
    res.send(keys)
}

const fidoDeleteKey = async (req, res) => {

    const keyID = req.body.keyID

    if (keyID) {

        await User.updateOne({
            _id: req.user._id
        }, {
            $pull: {
                fido: {
                    _id: keyID
                }
            }
        })

        await req.user.save()

        res.sendStatus(200)
    } else {
        res.sendStatus(400)
    }

}

module.exports = {
    attestFido,
    registerFido,
    assertFido,
    loginFido,
    fidoGetKeys,
    fidoDeleteKey
}
