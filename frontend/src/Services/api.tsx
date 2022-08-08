const apiURL = process.env.REACT_APP_API_PREFIX || ""

const requestClient = (method: string, url: string, data: BodyInit | null | undefined, contentType: string | null) => {
    return fetch(apiURL + url, {
        method: method,
        credentials: "include",
        headers: {
            "Content-Type": contentType || "text/plain"
        },
        body: data
    })
}

// General Auth Stuff

export const isLoggedIn = async () => {
    const response = await requestClient('GET', '/api/me', null, null)
    return response.status === 200
}

export const logout = async () => {
    await requestClient('GET', '/api/logout', null, null)
}
// Password stuff

export const login = async (user: string, pass: string) => {
    return await requestClient('POST', '/api/pass/login', JSON.stringify({
        username: user,
        password: pass
    }), "application/json")
}

export const register = async (user: string, pass: string) => {
    const response = await requestClient('POST', '/api/pass/register', JSON.stringify({
        username: user,
        password: pass
    }), "application/json")
    return response.status === 200
}

// Fido Stuff
const ab2base64 = (buffer: ArrayBuffer | null) => {
    if (buffer) {
        let str = ''
        let bytes = new Uint8Array(buffer)
        for (let i = 0; i < bytes.byteLength; i++) {
            str += String.fromCharCode(bytes[i])
        }
        return window.btoa(str)
    } else {
        return null
    }
}

function str2ab(str: string) {
    let bufView = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return bufView;
}

export const fidoAttestation = () => {
    return requestClient('GET', '/api/fido/register', null, null)
        .then(response => response.json())
        .then(attestationOptions => {
            attestationOptions.challenge = str2ab(attestationOptions.challenge)
            attestationOptions.user.id = str2ab(attestationOptions.user.id)

            return attestationOptions
        })
        .catch(() => {/* ignore */
        })
}

export const fidoRegister = async (cred: Credential) => {
    const credPub = cred as PublicKeyCredential

    const attestationResponse = credPub.response as AuthenticatorAttestationResponse

    const response = {
        id: credPub.id,
        rawId: ab2base64(credPub.rawId),
        response: {
            attestationObject: ab2base64(attestationResponse.attestationObject),
            clientDataJSON: ab2base64(attestationResponse.clientDataJSON)
        },
        clientExtension: credPub.getClientExtensionResults()
    }

    const result = await requestClient('POST', '/api/fido/register', JSON.stringify(response), 'application/json')
    return result.status === 200
}

export const fidoAssertion = async () => {
    return await requestClient('GET', '/api/fido/login', null, null)
        .then(response => response.json())
        .then(assertionOptions => {
            assertionOptions.challenge = str2ab(assertionOptions.challenge)

            return assertionOptions
        })
}

export const fidoLogin = async (cred: Credential) => {
    const credPub = cred as PublicKeyCredential

    const assertionResponse = credPub.response as AuthenticatorAssertionResponse

    const response = {
        id: credPub.id,
        response: {
            clientDataJSON: ab2base64(assertionResponse.clientDataJSON),
            signature: ab2base64(assertionResponse.signature),
            authenticatorData: ab2base64(assertionResponse.authenticatorData),
            userHandle: ab2base64(assertionResponse.userHandle)
        }
    }

    return await requestClient('POST', '/api/fido/login', JSON.stringify(response), 'application/json')
}

export const fidoKeys = async () => {
    return await requestClient('GET', '/api/fido/keys', null, null)
        .then(response => response.json())
}

export const fidoDeleteKey = async (keyID: String) => {
    const response = await requestClient('POST', '/api/fido/key', JSON.stringify({keyID: keyID}), 'application/json')
    return response.status === 200
}

// 2FA Stuff
export const twofactorRegister = async () => {
    return await requestClient('GET', '/api/2fa/generate', null, null)
        .then(response => response.json())
}

export const twofactorCheck = async () => {
    const response = await requestClient('GET', '/api/2fa/enabled', null, null)
    return response.status === 200
}

export const twofactorLogin = async (pin: String) => {
    return await requestClient('POST', '/api/2fa/login', JSON.stringify({twofactor: pin}), 'application/json')
}

// Login Stuff
export const getRequiredLogin = async () => {
    return await requestClient('GET', '/api/me/login', null, null)
        .then(response => response.json())
}

export const setRequiredLogin = async (twofactor: Boolean, fido2: Boolean) => {
    await requestClient('POST', '/api/me/login', JSON.stringify({
        twofactor: twofactor,
        fido2: fido2
    }), 'application/json')
}
