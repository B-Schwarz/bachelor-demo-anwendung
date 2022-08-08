import * as React from "react"
import {ChakraProvider,} from "@chakra-ui/react"
import {BrowserRouter as Router, Navigate, Route, Routes} from "react-router-dom";
import {MenuButtonSelectEnum} from "./Pages/menu/menu-button-select.enum";

import User from "./Pages/User";
import Home from "./Pages/Home";
import Menu from "./Pages/menu/Menu";
import Login from "./Pages/auth/login";

export const App = () => (
    <ChakraProvider>
        <Router>
            <Routes>
                <Route path="/user" element={
                    <><Menu selected={MenuButtonSelectEnum.USER} /><User/></>}/>
                <Route path='/login' element={
                    <><Menu selected={MenuButtonSelectEnum.LOGIN}/><Login/></>}/>
                <Route path='/' element={
                    <><Menu selected={MenuButtonSelectEnum.HOME}/><Home/></>}/>
                <Route path="*" element={
                    <Navigate to={'/'} replace/> }/>
            </Routes>
        </Router>
    </ChakraProvider>
)
