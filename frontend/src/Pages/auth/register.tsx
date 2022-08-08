import React, {useState} from "react"
import {Alert, AlertIcon, Button, Input, InputGroup, InputRightElement} from "@chakra-ui/react";
import {register} from "../../Services/api";

const App = () => {

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [passwordRepeat, setPasswordRepeat] = useState("")
    const [show, setShow] = React.useState(false)
    const [error, setError] = useState(false)
    const [errorRepeat, setErrorRepeat] = useState(false)
    const [success, setSuccess] = useState(false)

    const handlePasswordMatch = (pass: string) => {
        setPasswordRepeat(pass)
        setErrorRepeat(password !== pass)
    }

    const handleClick = () => setShow(!show)
    const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {

        register(username, password)
            .then(status => {
                setSuccess(status)
                setError(!status)

                if (status) {
                    setUsername('')
                }

                setPassword('')
                setPasswordRepeat('')
            })
            .catch(() => {/* ignore */})

        evt.preventDefault()
    }

    return (
        <React.Fragment>
            <Alert status='success' marginBottom='1rem' hidden={!success}>
                <AlertIcon/>
                Your Account is now created and you can login!
            </Alert>
            <Alert status='error' marginBottom='1rem' hidden={!error}>
                <AlertIcon/>
                The username is already taken.
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
                <InputGroup size='md'>
                    <Input
                        pr='4.5rem'
                        type={show ? 'text' : 'password'}
                        placeholder='Repeat Password'
                        value={passwordRepeat}
                        onChange={evt => handlePasswordMatch(evt.target.value)}
                        borderColor={errorRepeat ? 'red' : 'chakra-border-color'}
                    />
                </InputGroup>
                <Button type='submit' marginTop='1rem' marginLeft='70%' disabled={password !== passwordRepeat || password === ""}>Register</Button>
            </form>
        </React.Fragment>
    )

}

export default App
