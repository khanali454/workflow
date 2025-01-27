import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Loader from './Loader';
import Form from 'react-bootstrap/Form';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import '../../public/css/picker.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import '../../public/css/uploader.css';
import fs from 'fs';

function TableRow({ board_id, item_ids, length }) {
    const token = localStorage.getItem('access_token');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusDropdown, setStatusDropdown] = useState(false);
    const [dates, setDates] = useState({});
    const [files, setFiles] = useState({});
    const [statuses, setStatuses] = useState();
    const [c_item, setCItem] = useState(null); // for current item
    const [c_column, setCColumn] = useState(null); // for current column
    const [reload, setReload] = useState(false);
    const [loading_statuses, setLoadingStatuses] = useState(false);

    useEffect(() => {
        // Only send the request if item_ids is not empty
        if (item_ids && item_ids.length > 0) {
            axios.post('https://api.monday.com/v2', {
                query: `query {
                    items (ids: [${item_ids.join(',')}]) {
                    id
                    name
                        column_values {
                            column {
                                id
                                title
                            }
                            id
                            type
                            value
                            ... on StatusValue {
                                label
                                update_id
                                label_style {border color}
                            }
                            ... on DateValue {
                                time
                                date
                            }
                            ... on PeopleValue {
                                text
                            }
                             ... on TextValue {
                                text
                                value
                            }
                            ... on NumbersValue {
                                number
                                id
                                symbol
                                direction
                            }
                        }
                    }
                }`,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then((response) => {
                setLoading(false);
                console.log("items : ", response?.data?.data?.items);
                setItems(response?.data?.data?.items || []);
            }).catch((error) => {
                console.error('Error fetching data from Monday.com:', error);
                setLoading(false);
            });
        }
    }, [item_ids, token, reload]);

    const updateColumnValue = async (boardId, itemId, columnId, value) => {
        await axios.post('https://api.monday.com/v2', {
            query: `mutation {
                        change_simple_column_value (item_id:${itemId}, board_id:${boardId}, column_id:"${columnId}", value: "${value}") {
                            id
                        }
                    }`,
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then((response) => {
            toast.success("Column updated successfully!");
            setReload(!reload);
        }).catch((error) => {
            toast.error("An unknown error occured! Try again.");
            console.log("error while updating : ", error);
        })
    };

    const handleChange = (boardId, itemId, columnId, value) => {
        updateColumnValue(boardId, itemId, columnId, value);
    };

    const handleChangeStatus = (boardId, itemId, columnId, value) => {
        setStatusDropdown(false);
        updateColumnValue(boardId, itemId, columnId, value);
    };

    // const statuses = {
    //     task_status: {
    //         0 : 'In Progress',
    //         1 : 'Done',
    //         2 : 'Pending Deploy',
    //         3 : 'Waiting For Review',
    //         11 : 'Ready To Start'
    //     },
    //     task_priority: {
    //         'Critical': 'Critical',
    //         'Best Effort': 'Best Effort',
    //         'High': 'High',
    //         'Missing': 'Missing',
    //         'Medium': 'Medium',
    //         'Low': 'Low'
    //     },
    //     task_type: {
    //         'Quality': 'Quality',
    //         'Feature': 'Feature',
    //         'Bug': 'Bug',
    //         'Security': 'Security',
    //         'Test': 'Test'
    //     }
    // }

    const handleDateChange = (boardId, itemId, date) => {
        const formattedDate = date.toISOString().split('T')[0];
        // console.log(formattedDate)
        setDates(prevDates => ({
            ...prevDates,
            [itemId]: formattedDate
        }));

        updateColumnValue(boardId, itemId, 'date', formattedDate);
    }

    const handleFileChange = (itemId, files) => {
        if (files.length > 0) {
            console.log(files)
            const url = "https://api.monday.com/v2/file";
            const query = `mutation ($file: File!) {
                add_file_to_column (file: $file, item_id: ${itemId}, column_id: "files") {
                    id
                }
            }`;
            const boundary = "xxxxxxxxxx";

            files.forEach(fileObj => {
                const file = fileObj.file;
                const reader = new FileReader();

                reader.onload = async (event) => {
                    const content = event.target.result;
                    const data =
                        `--${boundary}\r\n` +
                        `Content-Disposition: form-data; name="query"\r\n\r\n` +
                        `${query}\r\n` +
                        `--${boundary}\r\n` +
                        `Content-Disposition: form-data; name="variables[file]"; filename="${file.name}"\r\n` +
                        `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n` +
                        `${content}\r\n` +
                        `--${boundary}--`;

                    try {
                        const response = await axios.post(url, {
                            headers: {
                                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                                Authorization: `Bearer ${token}`,
                            },
                            body: data,
                        });

                        const result = response.json();
                        console.log("Upload successfull:", result);
                    } catch (error) {
                        console.error("Error uploading file:", error);
                        toast.error(`Error uploading file ${file.name}`);
                    }
                }

                reader.onerror = (error) => {
                    console.error("FileReader error:", error);
                    toast.error(`Error reading file ${file.name}`);
                };

                reader.readAsBinaryString(file);
            });
        }
    }

    const getSelectedDate = (item) => {
        console.log(item)
        const itemValue = item?.column_values?.find(col => col.type === 'item_id')?.value;

        if (itemValue) {
            let parsedValue;
            try {
                parsedValue = JSON.parse(itemValue);
            } catch (error) {
                console.error("Error parsing item value:", error);
                parsedValue = undefined;
                return null;
            }

            if (parsedValue?.item_id) {
                return dates[parsedValue?.item_id];
            }
        }
        return null;
    }


    const changeStatusColumn = (itemId, columnId) => {
        if (itemId) {
            setStatusDropdown(true);
            getStatuses(columnId);
            setCItem(itemId);
            setCColumn(columnId);
        }
    }

    const getStatuses = (columnId) => {
        setLoadingStatuses(true);
        axios.post('https://api.monday.com/v2', {
            query: `query {
            boards (ids: ${board_id}) {
              columns(ids:"${columnId}") {
                id
                settings_str
              }
            }
          }`,
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then((response) => {
            let statuses_all = JSON.parse(response?.data?.data?.boards[0]?.columns[0]?.settings_str);
            let rows = [];
            for (var key in statuses_all.labels) {
                rows.push({
                        index:key,
                        label:statuses_all?.labels[key],
                        style:statuses_all?.labels_colors[key]
                })
            }
            setStatuses(rows);
        }).catch((error) => {
            console.error('Error fetching statuses from Monday.com:', error);
        }).finally(() => {
            setLoadingStatuses(false);
        });

    }



    return (
        <>
            <div>
                <ToastContainer />
            </div>
            {(loading && length) && (
                <tbody>
                    <tr>
                        <td className="text-center border border-pink-100 py-8" colSpan={length}>
                            <Loader width={15} height={15} />
                        </td>
                    </tr>
                </tbody>
            )}

            {!loading && (
                <tbody>
                    {statusDropdown && (
                        <div className="w-full h-full z-40 flex items-center justify-center absolute top-0 left-0" style={{ background: "rgba(0,0,0,0.5)" }}>
                            {loading_statuses && (
                                <div className='w-[300px] h-[100px] flex items-center justify-center'>
                                    <Loader />
                                </div>
                            )}
                            {!loading_statuses && (
                                <ul className="h-fit w-[300px] bg-white relative z-40">
                                    <div className="close absolute z-[1000] text-black bg-white w-[32px] h-[32px] rounded-full flex items-center justify-center p-0 right-[calc(50%-16px)] top-[-38px] cursor-pointer" onClick={() => { setStatusDropdown(false) }}>X</div>
                                    {statuses?.length > 0 && statuses?.map((status) => (
                                        <li onClick={() => { handleChangeStatus(board_id, c_item, c_column, status?.index) }} className="w-full border cursor-pointer px-1 flex items-center justify-center h-[30px] text-black text-xs" style={{ backgroundColor: `${status?.style?.color}` }}>
                                            {status?.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    {items?.map((item, itemIndex) => (
                        <tr key={itemIndex}>
                            <td key={0} className="border border-pink-800 px-1 text-center w-fit text-xs py-2">
                                {item?.name}
                            </td>
                            {item?.column_values?.map((column, columnIndex) => (
                                <>
                                    <td key={columnIndex + 1} className="border px-1 border-pink-800 text-center w-fit text-xs whitespace-nowrap py-2">

                                        {(column?.type == "date") && (
                                            <DatePicker
                                                dateFormat={"yyyy-MM-dd"}
                                                selected={column?.date}
                                                onChange={(date) => {
                                                    updateColumnValue(board_id, item?.id, column?.id, date.toISOString().split('T')[0]);
                                                }}
                                            />
                                        )}
                                        {(column?.type == "people") && (
                                            <>
                                                {column?.text !== "" && (
                                                    <>{column?.text}</>
                                                )}
                                                {column?.text == "" && (
                                                    <>---</>
                                                )}
                                            </>
                                        )}
                                        {(column?.type == "text") && (
                                            <>
                                                {column?.text !== "" && (
                                                    <>{column?.text}</>
                                                )}
                                                {column?.text == "" && (
                                                    <>---</>
                                                )}
                                            </>
                                        )}


                                        {column?.type === "file" && (
                                            <div style={{ flexDirection: 'column' }} className='flex items-center gap-4'>
                                                <div>
                                                    {column?.value ? JSON.parse(column?.value)?.files?.[0]?.name : "---"}
                                                </div>
                                            </div>
                                        )}

                                        {column.type === 'status' && (
                                            <div onClick={() => { changeStatusColumn(item?.id, column?.id) }} style={{ backgroundColor: `${column?.label_style?.color}` }} className='w-full h-[23px] flex items-center justify-center rounded'>
                                                {column?.label}
                                            </div>
                                        )}
                                    </td>
                                </>
                            ))}
                        </tr>
                    ))}
                </tbody>
            )}
        </>
    );
}

export default TableRow;
