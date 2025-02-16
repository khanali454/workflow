import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';

function Automations() {
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { board_id } = useParams();
    const token = localStorage.getItem('access_token');
    const navigate = useNavigate();

    useEffect(() => {
        if (token == null || token === "") {
            navigate('/');
        }
    }, [token, navigate]);

    // Fetch automations from the API
    useEffect(() => {
        const fetchAutomations = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/automations?board_id=` + board_id);
                setAutomations(response.data.data); // Assuming the response has a 'data' property
                setLoading(false);
            } catch (err) {
                setError('Failed to load automations');
                setLoading(false);
            }
        };

        fetchAutomations();
    }, [board_id]);

    // Function to handle deletion of an automation
    const deleteAutomation = async (automationId) => {
        try {
            const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/delete/automation`, {
                data: { automationId }
            });

            if (response.data.success) {
                // Remove the deleted automation from the list
                setAutomations((prevAutomations) => prevAutomations.filter(automation => automation._id !== automationId));
            } else {
                setError('Failed to delete automation');
            }
        } catch (err) {
            setError('Error deleting automation');
            console.error(err);
        }
    };

    return (
        <div className="p-4 h-screen">
            <div className="py-2 flex items-center gap-2">
                <Link to={'/'} className='bg-gray-300 px-3 py-1 rounded text-black'>
                    Home
                </Link>
            </div>
            <div className="border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">
                <section className="relative py-6 bg-blueGray-50">
                    <div className="w-full px-4">
                        <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-pink-900 text-white">
                            <div className="block w-full overflow-x-auto">
                                {loading ? (
                                    <div className='px-2 py-4'>
                                        <Loader />
                                    </div>
                                ) : error ? (
                                    <div className='px-2 py-3'>{error}</div>
                                ) : (
                                    <table className="items-center w-full bg-transparent border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Board Id</th>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Column Id</th>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Column Type</th>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Column Value</th>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Users</th>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Notification</th>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Template</th>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {automations.map((automation) => (
                                                <tr key={automation._id}>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">{automation.board_id}</td>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">{automation.columnId}</td>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">{automation.columnType}</td>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">{automation.columnValue}</td>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">
                                                        {automation.users.map((user) => (
                                                            <div key={user.id}>{user.email}</div>
                                                        ))}
                                                    </td>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">{automation.notification}</td>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">{automation.template}</td>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">
                                                        <button
                                                            onClick={() => deleteAutomation(automation._id)}
                                                            className="bg-red-500 text-white px-3 py-1 rounded"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Automations;
