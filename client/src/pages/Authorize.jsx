import React from 'react'
import { useNavigate } from 'react-router-dom';

function Authorize() {

    const token = localStorage.getItem('access_token');
    const navigate = useNavigate();

    if (token) {
        navigate('/monday/app');
    }


    return (
        <div className="flex items-center justify-center w-screen h-screen bg-slate-600">
            <a href={`https://auth.monday.com/oauth2/authorize?client_id=${import.meta.env.VITE_APP_CLIENT_ID}`} className="bg-white text-black rounded-sm px-4 py-1 cursor-pointer">Authorize</a>
        </div>
    )
}

export default Authorize