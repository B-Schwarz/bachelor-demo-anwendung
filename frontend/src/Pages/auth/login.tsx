import {Center, Flex, Heading, Tab, TabList, TabPanel, TabPanels, Tabs} from '@chakra-ui/react'
import React, {useEffect, useState} from 'react'
import Password from "./password";
import Register from "./register";
import {isLoggedIn} from "../../Services/api";
import {useNavigate} from "react-router-dom";
import Fido2 from "./fido2";
import {LoginTypeEnum} from "./LoginType.enum";
import Twofactor from "./twofactor";

const App = () => {

    const navigate = useNavigate()

    const [def, setDef] = useState(true)

    const [pass, setPass] = useState(false)
    const [fido2, setFido2] = useState(false)
    const [twofactor, set2FA] = useState(false)

    const doLogin = (next: LoginTypeEnum) => {
        switch (next) {
            case LoginTypeEnum.DONE:
                window.location.reload()
                break
            case LoginTypeEnum.FIDO2:
                setDef(false)
                setFido2(true)
                setPass(false)
                set2FA(false)
                break
            case LoginTypeEnum.PASSWORD:
                setDef(false)
                setFido2(false)
                setPass(true)
                set2FA(false)
                break
            case LoginTypeEnum.TWOFACTOR:
                setDef(false)
                setFido2(false)
                setPass(false)
                set2FA(true)
                break
        }
    }

    useEffect(() => {
        isLoggedIn()
            .then(status => {
                if (status) {
                    navigate('/user')
                }
            })
            .catch(() => {/* ignore */})
    }, [])

    return (
        <Center w="100vw" h="100vh">

            <Tabs variant='enclosed' isFitted hidden={!def}>
                <TabList>
                    <Tab>Login</Tab>
                    <Tab>Register</Tab>
                </TabList>
                <Flex w="sm" boxShadow="base" borderRadius="md" padding={8} direction="column">
                    <TabPanels>
                        <TabPanel>
                            <Password login={doLogin}/>
                        </TabPanel>
                        <TabPanel>
                            <Register/>
                        </TabPanel>
                    </TabPanels>
                </Flex>
            </Tabs>

            <Flex w="sm" boxShadow="base" borderRadius="md" padding={8} direction="column" hidden={def}>
                <Heading textAlign="center" mb={5}>Login</Heading>
                {
                    pass && <Password login={doLogin}/>
                }
                {
                    fido2 && <Fido2 login={doLogin}/>
                }
                {
                    twofactor && <Twofactor login={doLogin}/>
                }
            </Flex>

        </Center>
    )
}

export default App
