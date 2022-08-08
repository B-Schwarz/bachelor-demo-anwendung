import React, {useEffect, useState} from "react"
import withAuth from "../Services/WithAuth";
import {
    Button,
    Container,
    FormControl,
    Grid,
    GridItem,
    Heading,
    IconButton,
    Image,
    Switch,
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useToast
} from "@chakra-ui/react";
import {CheckIcon, DeleteIcon} from '@chakra-ui/icons'
import {
    fidoAttestation,
    fidoDeleteKey,
    fidoKeys,
    fidoRegister,
    getRequiredLogin,
    setRequiredLogin,
    twofactorCheck,
    twofactorRegister
} from "../Services/api";

const App = () => {

    const [key, setKey] = useState<{ counter: number, credId: string, guid: string, key: string, _id: string }[]>([])
    const [twofactor, setTwofactor] = useState(false)
    const [qr, setQr] = useState("")
    const [showQR, setShowQR] = useState(false)

    const [enableTwofactor, setEnableTwofactor] = useState(false)
    const [enableFido2, setEnableFido2] = useState(false)

    const toast = useToast()

    const registerFido = async () => {
        const attestationOptions = await fidoAttestation()

        const cred = await navigator.credentials.create({
            publicKey: attestationOptions
        })

        if(await fidoRegister(cred!)) {
            window.location.reload()
        }
    }

    const update = () => {
        fidoKeys()
            .then(keys => setKey(keys))
    }

    const getFido = () => {
        update()
    }

    const showError = () => {
        toast({
            title: 'Delete Failed!',
            description: "Something went wrong while deleting the key",
            status: 'error',
            duration: 9000,
            isClosable: true,
        })
    }

    const deleteKey = async (id: string) => {
        fidoDeleteKey(id)
            .then(response => {
                if (response) {
                    update()
                } else {
                    showError()
                }
            })
            .catch((e) => {
                console.log(e)
                showError()
            })
    }

    const get2FA = () => {
        twofactorCheck()
            .then(result => setTwofactor(result))
    }

    const create2FA = async () => {
        const result = await twofactorRegister()
        setQr(result.qr)
        setShowQR(true)
    }

    const getLogin = () => {
        getRequiredLogin()
            .then(response => {
                setEnableTwofactor(response.twofactor)
                setEnableFido2(response.fido2)
            })
            .catch(() => {/* ignore */})
    }

    const setLogin = async (twofactor: Boolean, fido2: Boolean) => {
        await setRequiredLogin(twofactor, fido2)
    }

    useEffect(() => {
        getFido()
        get2FA()
        getLogin()
    }, [])

    return (
        <React.Fragment>

            <Grid templateColumns='repeat(2, 1fr)' gap={6} marginLeft='3rem'>
                <GridItem>
                    <Heading>Register Fido2 Key</Heading>

                    <Button onClick={registerFido} marginTop='1rem'>Register!</Button>
                </GridItem>
                <GridItem>
                    <Heading>Current Fido2 Keys</Heading>

                    <TableContainer marginTop='1rem'>
                        <Table variant='simple'>
                            <Thead>
                                <Tr>
                                    <Th>GUID</Th>
                                    <Th>Counter</Th>
                                    <Th>Delete?</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {
                                    key.map((k, i) => (
                                        <Tr key={k._id}>
                                            <Td>{k.guid}</Td>
                                            <Td>{k.counter}</Td>
                                            <Td>
                                                <IconButton aria-label={'delete the key'} colorScheme='red' icon={<DeleteIcon />}
                                                onClick={() => deleteKey(k._id)}/>
                                            </Td>
                                        </Tr>
                                    ))
                                }
                            </Tbody>
                        </Table>
                    </TableContainer>
                </GridItem>
                <GridItem>
                    <Heading marginBottom='1rem'>2FA</Heading>
                    <Container hidden={!twofactor}>
                        <CheckIcon /> Activated!
                    </Container>
                    <Button hidden={twofactor} onClick={() => create2FA()}>Activate</Button>
                    <Image src={qr} alt='QR Code for two factor authorization' hidden={!showQR} marginTop='1rem'/>
                </GridItem>
                <GridItem>
                    <Heading>Authorization needed</Heading>
                    <FormControl>
                        <Switch id='enable-2fa' isChecked={enableTwofactor} onChange={async (evt) => {
                            setEnableTwofactor(evt.target.checked)
                            await setLogin(evt.target.checked, enableFido2)
                        }}>2FA</Switch><br />
                        <Switch id='enable-fido2' isChecked={enableFido2} onChange={async (evt) => {
                            setEnableFido2(evt.target.checked)
                            await setLogin(enableTwofactor, evt.target.checked)
                        }}>Fido 2</Switch>
                    </FormControl>
                </GridItem>
            </Grid>

        </React.Fragment>
    )

}

export default withAuth(App)
