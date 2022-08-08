import React, {useState} from "react"
import {login} from "../../Services/api";
import {Alert, AlertIcon, Button, Input, InputGroup, InputRightElement} from "@chakra-ui/react";
import {LoginTypeEnum} from "./LoginType.enum";

const App = (props: { login: (next: LoginTypeEnum) => void }) => {

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [show, setShow] = React.useState(false)
    const [error, setError] = useState(false)

    const handleClick = () => setShow(!show)
    const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {

        login(username, password)
            .then(async response => {
                if (response.status === 200) {
                    setError(false)

                    try {
                        const responseJSON = await response.json()

                        if (responseJSON.next === '2FA') {
                            props.login(LoginTypeEnum.TWOFACTOR)
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
            .catch(() => {/* ignore */
            })

        evt.preventDefault()
    }

    return (
        <React.Fragment>

            <Alert status='error' marginBottom='1rem' hidden={!error}>
                <AlertIcon/>
                The username and password did not match.
            </Alert>
            <form onSubmit={handleSubmit}>
                <Input placeholder='Username' value={username} type='text'
                       onChange={evt => setUsername(evt.target.value)}
                       borderColor={error ? 'red' : 'chakra-border-color'}/>
                <InputGroup size='md'>
                    <Input
                        pr='4.5rem'
                        type={show ? 'text' : 'password'}
                        placeholder='Password'
                        value={password}
                        onChange={evt => setPassword(evt.target.value)}
                        borderColor={error ? 'red' : 'chakra-border-color'}
                    />
                    <InputRightElement width='4.5rem'>
                        <Button h='1.75rem' size='sm' onClick={handleClick}>
                            {show ? 'Hide' : 'Show'}
                        </Button>
                    </InputRightElement>
                </InputGroup>
                <Button type='submit' marginTop='1rem' marginLeft='75%'>Login</Button>
            </form>

        </React.Fragment>
    )
}

export default App
