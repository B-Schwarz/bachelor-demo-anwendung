import React from "react"
import {Button, useToast} from "@chakra-ui/react";
import {fidoAssertion, fidoLogin} from "../../Services/api";
import {LoginTypeEnum} from "./LoginType.enum";

const App = (props: { login: (next: LoginTypeEnum) => void }) => {

    const toast = useToast()

    const showError = () => {
        toast({
            title: 'Login Failed!',
            description: "The login failed",
            status: 'error',
            duration: 9000,
            isClosable: true,
        })
    }

    const loginFido = async () => {
        const assertionOptions = await fidoAssertion()

        try {
            const cred = await navigator.credentials.get({
                publicKey: assertionOptions
            })

            fidoLogin(cred!)
                .then(async response => {
                    if (response)
                        if (response.status === 200) {
                            try {
                                const responseJSON = await response.json()

                                if (responseJSON.next === 'PASSWORD') {
                                    props.login(LoginTypeEnum.PASSWORD)
                                } else if (responseJSON.next === '2FA') {
                                    props.login(LoginTypeEnum.TWOFACTOR)
                                }
                            } catch (_) { // No next
                                props.login(LoginTypeEnum.DONE)
                            }
                        } else {
                            showError()
                        }
                    else {
                        showError()
                    }
                })
        } catch (e) {
            showError()
        }
    }

    return (
        <React.Fragment>
            <Button colorScheme='messenger' margin='auto' marginTop='0.25rem'
                    onClick={loginFido}>
                FIDO 2
            </Button>
        </React.Fragment>
    )

}

export default App
