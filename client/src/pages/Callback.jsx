import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const Callback = () => {
    let [searchParams, setSearchParams] = useSearchParams();
    let code = searchParams.get('code');
    const navigate = useNavigate()


    

    useEffect(()=>{
        axios.post(`${import.meta.env.VITE_API_BASE_URL}/access/token`, {
            code: code
        }).then((resp) => {
            localStorage.setItem('access_token', resp?.data?.access_token)
            toast.success("Authorized successfully");
            navigate('/monday/app')
        }, (error) => {
            // toast.error(error?.response?.data?.error);
            // navigate('/')
            console.log("error : ",error);
        })
    },[code])



    return (
        <div>
            <ToastContainer />
        </div>
    )
}
