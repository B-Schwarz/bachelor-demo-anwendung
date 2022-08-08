import React, {useEffect, useState} from "react"
import {MenuButtonSelectEnum} from "./menu-button-select.enum"
import {useNavigate} from "react-router-dom"
import {Box, Button, Divider, HStack, Spacer} from "@chakra-ui/react";
import {isLoggedIn, logout} from "../../Services/api";

const App = (props: { selected: MenuButtonSelectEnum }) => {

    const [loggedIn, setLoggedIn] = useState(false)

    const buttons = [
        {
            name: 'Home',
            selected: MenuButtonSelectEnum.HOME,
            login: false
        },
        {
            name: 'User',
            selected: MenuButtonSelectEnum.USER,
            login: true
        }
    ]

    const navigate = useNavigate()

    useEffect(() => {
        isLoggedIn()
            .then(status => setLoggedIn(status))
            .catch(() => { /* ignore */
            })
    }, [])

    return (
        <React.Fragment>
            <Box padding='0.2rem'>
                <HStack>
                    {
                        buttons.filter(btn => !btn.login).map((btn, index) => (
                            <Button key={index} colorScheme={'gray'}
                                    variant={props.selected === btn.selected ? 'solid' : 'ghost'}
                                    style={{textDecoration: "none"}}
                                    onClick={() => {
                                        navigate(`/${btn.name.toLowerCase()}`)
                                    }}>
                                {btn.name}
                            </Button>
                        ))
                    }
                    {
                        loggedIn && buttons.filter(btn => btn.login).map((btn, index) => (
                            <Button key={index} colorScheme={'gray'}
                                    variant={props.selected === btn.selected ? 'solid' : 'ghost'}
                                    style={{textDecoration: "none"}}
                                    onClick={() => {
                                        navigate(`/${btn.name.toLowerCase()}`)
                                    }}>
                                {btn.name}
                            </Button>
                        ))
                    }
                    <Spacer/>
                    {loggedIn ?
                        <Button colorScheme={'orange'}
                                variant={props.selected === MenuButtonSelectEnum.LOGIN ? 'solid' : 'ghost'}
                                style={{textDecoration: "none"}}
                                onClick={() => {
                                    logout()
                                        .then(() => {
                                            window.location.reload()
                                        })
                                        .catch(() => { /* ignore */})
                                }}>
                            Logout
                        </Button> :
                        <Button colorScheme={'teal'}
                                variant={props.selected === MenuButtonSelectEnum.LOGIN ? 'solid' : 'outline'}
                                style={{textDecoration: "none"}}
                                onClick={() => {
                                    navigate(`/login`)
                                }}>
                            Login / Register
                        </Button>
                    }
                </HStack>
            </Box>
            <Divider marginBottom='1rem'/>
        </React.Fragment>
    )

}

export default App
