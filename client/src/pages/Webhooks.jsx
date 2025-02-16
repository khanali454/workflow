import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';

function Webhooks() {
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { board_id } = useParams(); // Get the board_id from the URL params
    const token = localStorage.getItem('access_token');

    // Fetch webhooks for the given board_id
    useEffect(() => {
        const fetchWebhooks = async () => {

            const webhook_read_query = `
            query {
                webhooks(board_id: ${board_id}, app_webhooks_only: true) {
                    id
                    event
                    board_id
                    config
                }
            }`;

            try {
                const response = await axios.post(
                    'https://api.monday.com/v2',
                    { query: webhook_read_query },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                setWebhooks(response.data.data.webhooks); // Store webhooks in state
                setLoading(false);
            } catch (err) {
                setError('Failed to load webhooks');
                setLoading(false);
            }
        };

        fetchWebhooks();
    }, [board_id]);

    // Handle deletion of a webhook
    const handleDelete = async (webhookId) => {
       

        const delete_webhook_mutation = `
        mutation {
            delete_webhook(id: ${webhookId}) {
                id
                board_id
            }
        }`;

        try {
            await axios.post(
                'https://api.monday.com/v2',
                { query: delete_webhook_mutation },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setWebhooks((prev) => prev.filter((webhook) => webhook.id !== webhookId)); // Remove deleted webhook from the state
        } catch (err) {
            setError('Failed to delete webhook');
        }
    };

    return (
        <div className="p-4 h-screen">
            <div className="py-2 flex items-center gap-1">
                <Link to={'/'} className="bg-blue-500 px-3 py-1 rounded text-white">
                    Go Back
                </Link>
            </div>
            <div className="border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">
                <section className="relative py-6 bg-blueGray-50">
                    <div className="w-full px-4">
                        <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-pink-900 text-white">
                            <div className="block w-full overflow-x-auto">
                                {loading ? (
                                    <div className="px-2 py-4">
                                        <Loader />
                                    </div>
                                ) : error ? (
                                    <div className="px-2 py-3">{error}</div>
                                ) : (
                                    <table className="items-center w-full bg-transparent border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Webhook ID</th>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Event</th>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Board ID</th>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Config</th>
                                                <th className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {webhooks.map((webhook) => (
                                                <tr key={webhook.id}>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">{webhook.id}</td>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">{webhook.event}</td>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">{webhook.board_id}</td>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">{JSON.stringify(webhook.config)}</td>
                                                    <td className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">
                                                        <button
                                                            onClick={() => handleDelete(webhook.id)}
                                                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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

export default Webhooks;
