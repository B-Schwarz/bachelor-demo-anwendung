import React, {useState} from "react"
import {LoginTypeEnum} from "./LoginType.enum";
import {Alert, AlertIcon, Button, Input} from "@chakra-ui/react";
import {twofactorLogin} from "../../Services/api";

const App = (props: {login: (next: LoginTypeEnum) => void}) => {

    const [pin, setPin] = useState("")

    const [error, setError] = useState(false)

    const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {

        twofactorLogin(pin)
            .then(async response => {
                if (response.status === 200) {
                    setError(false)

                    try {
                        const responseJSON = await response.json()

                        if (responseJSON.next === 'PASSWORD') {
                            props.login(LoginTypeEnum.PASSWORD)
                        } else if (responseJSON.next === 'FIDO2') {
                            props.login(LoginTypeEnum.FIDO2)
                        }
                    } catch (_) { // No next
                        props.login(LoginTypeEnum.DONE)
                    }
                } else {
                    setError(true)
                }
            })
            .catch(() => {
                setError(true)
            })

        evt.preventDefault()
    }

    return (
        <React.Fragment>
            <Alert status='error' marginBottom='1rem' hidden={!error}>
                <AlertIcon/>
                The given pin is either too new or too old.
            </Alert>

            <form onSubmit={handleSubmit}>
                <Input placeholder='Pin' value={pin} type='text'
                       onChange={evt => setPin(evt.target.value)}
                       borderColor={error ? 'red' : 'chakra-border-color'}/>
                <Button type='submit' marginTop='1rem' marginLeft='75%'>Login</Button>
            </form>
        </React.Fragment>
    )
}

export default App
