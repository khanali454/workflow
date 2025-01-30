import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import { FaArrowDown, FaLongArrowAltDown } from "react-icons/fa";
import { toast } from 'react-toastify';


const Automation = () => {
  const token = localStorage.getItem('access_token');
  const [loadingColumns, setLoadingColumns] = useState(false);
  const navigate = useNavigate();
  const [boards, setBoards] = useState();
  const [active_board_id, setActiveBoardId] = useState(null);
  const [active_board_name, setActiveBoardName] = useState(null);
  const [active_board, setActiveBoard] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [selectedColumnName, setSelectedColumnName] = useState(null);
  const columnModalRef = useRef(null);
  const valueModalRef = useRef(null);
  const notifyModalRef = useRef(null);
  const userModalRef = useRef(null);
  const [statuses, setStatuses] = useState([]);
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(null);
  const [selectedStatusLabel, setSelectedStatusLabel] = useState(null);
  const [selectedUserValue, setSelectedUserValue] = useState(null);
  const [selectedUserTitle, setSelectedUserTitle] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [notification_msg, setNotificationMsg] = useState(`Hey there,
{column_name} was marked as {status_value} on the board {board_id}`);
  const [users, setUser] = useState({});

  useEffect(() => {
    if (token != null && token != "") {
      axios.post('https://api.monday.com/v2', {
        query: "query{boards (limit:100000) {id name type item_terminology description} }"
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then((response) => {
        setBoards(response.data.data.boards.filter((board) => board.type == "board"));
      })
    } else {
      navigate('/')
    }
  }, [token])



  document.addEventListener("click", (e) => {
    if (columnModalRef.current && !columnModalRef.current.contains(e.target)) {
      setShowColumnModal(false);
    }
    if (valueModalRef.current && !valueModalRef.current.contains(e.target)) {
      setShowValueModal(false);
    }
    if (notifyModalRef.current && !notifyModalRef.current.contains(e.target)) {
      setShowNotifyModal(false);
    }
    if (userModalRef.current && !userModalRef.current.contains(e.target)) {
      setShowUserModal(false);
    }
  })


  const handleStatusColumn = () => {
    setShowColumnModal(!showColumnModal);
    setLoadingColumns(true);
    loadColumns();
  }

  const loadColumns = () => {
    if (active_board_id != null) {
      axios.post('https://api.monday.com/v2', {
        query: `query {
              boards (ids: ${active_board_id}) {
              subscribers{
              id
              is_admin
              is_guest
              email 
              }
              creator{
              id
              is_admin
              is_guest
              email 
              }
                columns (types:status){
                  id
                  title
                  type
                  width
                  settings_str
                }
              }
            }`
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then((response) => {
        let allData = response?.data?.data?.boards[0];
        setColumns(allData?.columns);
        setUser({
          me: allData?.creator,
          subscribers: allData?.subscribers
        });

      }).finally(() => {
        setLoadingColumns(false);
      })
    } else {
      alert("Please select a valid board from the left sidebar");
    }
  }





  const getStatuses = (columnId, columnName) => {
    setSelectedColumn(columnId);
    setSelectedColumnName(columnName);
    setSelectedStatusIndex(null);
    setSelectedStatusLabel("Something");
    setShowColumnModal(false);
    let statuses_all = JSON.parse(columns?.filter((col) => (col?.id == columnId))[0]?.settings_str);
    let rows = [];
    for (var key in statuses_all.labels) {
      rows.push({
        index: key,
        label: statuses_all?.labels[key],
        style: statuses_all?.labels_colors[key]
      })
    }
    setStatuses(rows);
  }

  const handleChangeStatus = (statusIndex, statusLabel) => {
    setSelectedStatusIndex(statusIndex);
    setSelectedStatusLabel(statusLabel);
    setShowValueModal(false);
    setShowValueModal(false);
  }


  async function webhookDuplicacy(boardId, columnId) {
    let webhook_read_query = `query {
      webhooks(board_id: ${boardId}){
        id
        event
        board_id
        config
      }
    }`;

    axios.post('https://api.monday.com/v2', {
      query: webhook_read_query
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then((response) => {
      console.log("response webhook readed : ", response);
    });

    return true;
  }


  const createAutomation = () => {
    let all_users = [];
    if (selectedUserTitle == "me") {
      all_users = [users?.me];
    } else if (selectedUserTitle == "subscribers") {
      all_users = users?.subscribers;
    }
    let automationData = {
      template: "when status changes to something notify someone",
      boardId: active_board_id,
      notification: `Hey there,'${selectedColumnName}' was marked as '${selectedStatusLabel}' on the board '${active_board_id}'.`,
      columnType: "status",
      columnId: selectedColumn,
      columnValue: selectedStatusLabel,
      users: all_users
    };

    if (webhookDuplicacy(active_board_id, selectedColumn)) {

    }


    const query = `
    mutation {
      create_webhook (
        board_id: ${active_board_id}, 
        url: "${import.meta.env.VITE_API_BASE_URL}/webhook", 
        event: change_status_column_value, 
        config: "{\\"columnId\\":\\"${selectedColumn}\\", \\"columnValue\\":{\\"$any$\\":true}}"
      ) { 
        id 
        board_id 
      } 
    }
  `;

    // let query = {
    //   query: `mutation{
    //   create_webhook (board_id: ${active_board_id}, url: '${import.meta.env.VITE_API_BASE_URL}/webhook', event: change_status_column_value, config: '{"columnId":"${selectedColumn}", "columnValue":{"$any$":true}}') {id board_id}}`
    // };
    // console.log("wbhk_query : ", query);
    // JSON.stringify({
    //   query : "mutation { create_webhook (board_id: 1234567890, url: \"https://www.webhooks.my-webhook/test/\", event: change_status_column_value, config: \"columnId\":\"status\", \"columnValue\":{ {\"$any$\":true}) { id board_id } }"
    // }
    axios.post('https://api.monday.com/v2', {query}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then((response) => {
      console.log("response webhook created : ", response);
    });



    // creat webhook !! 

    // console.log("automationData : ", automationData);

    // axios.post(`${import.meta.env.VITE_API_BASE_URL}/create/automation`, automationData).then((resp) => {
    //   if (resp?.data?.success) {
    //     alert("Automation Created successfully");
    //     console.log("success response : ", resp);
    //   } else {
    //     console.log("error response : ", resp);
    //     alert(resp?.data?.msg);
    //   }

    // }, (error) => {
    //   console.log("error : ", error);
    // });



  }



  return (
    <>
      <button data-drawer-target="logo-sidebar" data-drawer-toggle="logo-sidebar" aria-controls="logo-sidebar" type="button" className="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
        <span className="sr-only">Open sidebar</span>
        <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
        </svg>
      </button>

      <aside id="logo-sidebar" className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
          <a href="https://monday.com/" className="flex items-center ps-2.5 mb-5">
            <img src="https://monday.com/p/wp-content/uploads/2023/03/Logo-monday.com-2.png" className="h-12 me-3 sm:h-7" alt="Monday Logo" />
          </a>
          <ul className="space-y-2 font-medium">

            <li>
              <a href="#" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 18">
                  <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z" />
                </svg>
                <span className="flex-1 ms-3 whitespace-nowrap">All Boards</span>
              </a>
            </li>

            {boards?.length == 0 && (
              <p className="text-sm">No Board data</p>
            )}

            {boards?.length > 0 && boards?.map((board, key) => {
              return (
                <li title={board?.name} key={key}>
                  <a onClick={() => { setActiveBoardId(board?.id); setActiveBoardName(board?.name); }} className={`flex items-center p-2 cursor-pointer  rounded-lg ${board?.id == active_board_id ? 'bg-pink-800 text-pink-100 border-pink-700' : 'text-gray-900'} font-normal truncate ...`}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="19" height="19" aria-hidden="true" className="icon_1360dfb99d" data-testid="icon"><path d="M7.5 4.5H16C16.2761 4.5 16.5 4.72386 16.5 5V15C16.5 15.2761 16.2761 15.5 16 15.5H7.5L7.5 4.5ZM6 4.5H4C3.72386 4.5 3.5 4.72386 3.5 5V15C3.5 15.2761 3.72386 15.5 4 15.5H6L6 4.5ZM2 5C2 3.89543 2.89543 3 4 3H16C17.1046 3 18 3.89543 18 5V15C18 16.1046 17.1046 17 16 17H4C2.89543 17 2 16.1046 2 15V5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    <span className="flex-1 ms-2 whitespace-nowrap truncate ...">{board?.name}</span>
                  </a>
                </li>
              )
            })}

          </ul>
        </div>
      </aside>

      <div className="p-4 sm:ml-64 h-screen">
        <div className="border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">


          <section className="relative py-6 bg-blueGray-50">
            <div className="w-full px-4">
              <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-pink-900 text-white">



                {!active_board_id && (
                  <p className="p-4 text-gray text-sm">Select a board from left sidebar to create automation</p>
                )}

                {active_board_id && (
                  <>
                    <div className="rounded-t mb-0 px-4 py-3 border-0">
                      <div className="flex flex-wrap items-center">
                        <div className="relative w-full px-4 max-w-full flex-grow flex-1 ">
                          <h3 className="font-semibold text-lg text-white">
                            Automation {active_board_name != "" && (
                              <> - {active_board_name}</>
                            )}
                          </h3>
                        </div>
                      </div>
                    </div>
                    <div className="block w-full">
                      <p className="container bg-white w-full py-8 h-fit px-4 text-xl">
                        <p className='text-black select-none'>
                          When <span className='relative' ref={columnModalRef}>
                            <span className={`${showColumnModal ? 'text-green-500' : 'text-gray-500'}  border-b border-black text-lg cursor-pointer`} onClick={() => { handleStatusColumn() }}>
                              {selectedColumn && (
                                <>
                                  {selectedColumnName ? selectedColumnName : "status"}
                                </>
                              )}
                              {!selectedColumn && (
                                <>
                                  status
                                </>
                              )}
                            </span>
                            {showColumnModal && (
                              <ul className="absolute w-[200px] h-[180px] overflow-hidden overflow-y-auto px-3 py-3 bg-white shadow-sm border top-[100%] left-0 z-50">

                                {loadingColumns && (
                                  <d className="py-3 flex items-center w-full justify-center">
                                    <Loader />
                                  </d>
                                )}

                                {!loadingColumns && (
                                  <>
                                    <p className="text-gray-400 pb-1">
                                      Select a column
                                    </p>
                                    {columns?.length > 0 && columns?.map((column) => (
                                      <li key={column?.id} className='hover:bg-gray-100 cursor-pointer px-2 py-2 rounded text-sm' onClick={() => { getStatuses(column?.id, column?.title) }}>{column?.title}</li>
                                    ))}

                                  </>
                                )}

                              </ul>
                            )}

                          </span> changes to <span className='relative' ref={valueModalRef}>
                            <span className={`${showValueModal ? 'text-green-500' : 'text-gray-500'}  border-b border-black text-lg cursor-pointer`} onClick={() => { setShowValueModal(!showValueModal) }}>
                              {selectedStatusIndex && (
                                <>
                                  {selectedStatusLabel ? selectedStatusLabel : "Something"}
                                </>
                              )}
                              {!selectedStatusIndex && (
                                <>
                                  something
                                </>
                              )}
                            </span>
                            {showValueModal && (
                              <ul className="z-50 absolute w-[290px] h-[180px] overflow-hidden overflow-y-auto px-3 py-3 bg-white shadow-sm border top-[100%] left-0">

                                {!selectedColumn && (
                                  <p className="text-gray-400 pb-1">
                                    Select a status column first
                                  </p>
                                )}

                                {selectedColumn && (
                                  <>
                                    <li key={"1id"} onClick={() => { handleChangeStatus("Any", "Anything") }} className="w-full border cursor-pointer px-1 flex items-center justify-center h-[30px] text-black text-xs" style={{ backgroundColor: `gray` }}>
                                      Anything
                                    </li>
                                    {statuses?.length > 0 && statuses?.map((status) => (
                                      <li key={status?.index} onClick={() => { handleChangeStatus(status?.index, status?.label) }} className="w-full border cursor-pointer px-1 flex items-center justify-center h-[30px] text-black text-xs" style={{ backgroundColor: `${status?.style?.color}` }}>
                                        {status?.label}
                                      </li>
                                    ))}
                                  </>
                                )}
                              </ul>
                            )}
                          </span>

                          <FaLongArrowAltDown className='text-green-400 font-normal h-16' />


                          Then <span className='relative' ref={notifyModalRef}>
                            <span className={`${showNotifyModal ? 'text-green-500' : 'text-gray-500'}  border-b border-black text-lg cursor-pointer`} onClick={() => { setShowNotifyModal(!showNotifyModal) }}>
                              notify
                            </span>

                            {showNotifyModal && (
                              <div className="z-50 absolute w-[330px] h-[350px] overflow-hidden bg-white shadow-sm border top-[100%] left-0">
                                <p className="text-gray-700 text-sm py-2 border-gray-100 border-b text-center h-[40px] flex items-center justify-center">
                                  Type your notification message
                                </p>
                                <textarea className="outline-none border-b border-gray-100 w-full h-[140px] resize-none text-sm px-2 py-2" placeholder={`"Hey {item's assignee},
{item's name} was marked as {item's status}"`} readOnly>{notification_msg}</textarea>
                                <div className="w-full h-[123px] border-b border-gray-100 text-sm text-gray-700">
                                  <p className="px-2 text-sm text-gray-400 pb-1">Auto populate fields from board items</p>
                                  <div className="px-2 text-gray-200 border border-gray-100 h-[100px] overflow-y-auto flex">

                                  </div>
                                </div>
                                <div className="w-full h-[40px] px-2 flex items-center justify-end">
                                  <button className="bg-gray-200 text-xs px-2 py-1 rounded" onClick={() => { setShowNotifyModal(false) }}>Cancel</button>
                                  <button className="bg-green-200 text-xs px-2 py-1 ml-2 rounded" onClick={() => { setShowNotifyModal(false) }}>Done</button>
                                </div>
                              </div>
                            )}





                          </span> <span className='relative' ref={userModalRef}>
                            <span className={`${showUserModal ? 'text-green-500' : 'text-gray-500'}  border-b border-black text-lg cursor-pointer`} onClick={() => { setShowUserModal(!showUserModal) }}>
                              {selectedUserTitle && (
                                <>
                                  {selectedUserTitle ? selectedUserTitle : "someone"}
                                </>
                              )}
                              {!selectedUserTitle && (
                                <>
                                  someone
                                </>
                              )}
                            </span>
                            {showUserModal && (
                              <ul className="z-50 absolute w-[180px] h-[180px] overflow-hidden overflow-y-auto px-3 py-3 bg-white shadow-sm border top-[100%] left-0">

                                <p className="text-gray-400 pb-1">
                                  who to notify?
                                </p>

                                <li onClick={() => { setSelectedUserTitle("me"); setShowUserModal(false); }} className="w-full border-b cursor-pointer px-1 flex items-center justify-center h-[30px] text-black text-xs">
                                  me
                                </li>
                                <li onClick={() => { setSelectedUserTitle("subscribers"); setShowUserModal(false); }} className="w-full  cursor-pointer px-1 flex items-center justify-center h-[30px] text-black text-xs">
                                  subscribers
                                </li>

                              </ul>
                            )}
                          </span>

                        </p>
                        <button className="bg-blue-600 text-white px-4 text-sm py-2 rounded my-4 mt-8 cursor-pointer hover:bg-blue-500" onClick={() => { createAutomation(); }}>Create Automation</button>
                      </p>
                    </div>
                  </>
                )}

              </div>
            </div>
          </section>

        </div >
      </div >
    </>

  )
}

export default Automation