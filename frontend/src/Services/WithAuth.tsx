import React, {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {isLoggedIn} from "./api";

const WithAuth = (Component: React.FC) => {
    const useComponent = () => {

        const navigate = useNavigate()

        useEffect(() => {
            isLoggedIn()
                .then(r => {
                    if (!r) navigate('/')
                })
                .catch(() => navigate('/'))
        }, [])

        return (
            <Component />
        )
    }

    useComponent.displayName = Component.displayName
    return useComponent
}

export default WithAuth
