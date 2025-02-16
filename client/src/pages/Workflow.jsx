import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import TableRow from '../components/TableRow';

const Workflow = () => {
  const token = localStorage.getItem('access_token');
  const navigate = useNavigate();
  const [boards, setBoards] = useState();
  const [active_board_id, setActiveBoardId] = useState(null);
  const [active_board_name, setActiveBoardName] = useState(null);
  const [active_board, setActiveBoard] = useState(null);
  const [items_names, setItemsNames] = useState(null);
  const [columns, setColumns] = useState(null);
  const [loadingColumns, setLoadingColumns] = useState(false);

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



  useEffect(() => {
    // get columns and show in table 
    if (active_board_id != null) {
      axios.post('https://api.monday.com/v2', {
        query: `query {
            boards (ids: ${active_board_id}) {
            subscribers{
            email 
            }
            team_subscribers{
              users{
               email
              } 
            }
              columns {
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
        setColumns(response?.data?.data?.boards[0]?.columns);
      })
    }
  }, [active_board_id])


  // get custom column values mean item values
  useEffect(() => {
    // console.log(columns);
    if (active_board_id != null && columns != null) {
      axios.post('https://api.monday.com/v2', {
        query: `query {boards (ids: ${active_board_id}){
            items_page {
              cursor
              items {
                id 
                name
                assets {
                  id
                  url
                  name
                }
              }
            }
          }
        }`
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then((response) => {
        const active_board_items = response?.data?.data?.boards[0]?.items_page?.items;
        if (active_board_items.length > 0) {
          let item_idss = active_board_items.map(item => item.id);
          setActiveBoard(item_idss);
          setLoadingColumns(false);

        } else {
          setActiveBoard([]);
        }
        // console.log(active_board_items);
      })
    }
    // console.log(items_names);
  }, [columns])


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
                  <a onClick={() => { setActiveBoardId(board?.id); setActiveBoardName(board?.name); setLoadingColumns(true); }} className={`flex items-center p-2 cursor-pointer  rounded-lg ${board?.id == active_board_id ? 'bg-pink-800 text-pink-100 border-pink-700' : 'text-gray-900'} font-normal truncate ...`}>
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
        <div className="py-2 flex items-center gap-2">
          {active_board_id && (
         <>
          <Link to={'/automations/'+active_board_id} className='bg-blue-500 px-3 py-1 rounded text-white'>
            Automations
          </Link>
          <Link to={'/webhooks/'+active_board_id} className='bg-blue-500 px-3 py-1 rounded text-white'>
            Webhooks
          </Link>
         </>

          )}
        </div>
        <div className="border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">


          <section className="relative py-6 bg-blueGray-50">
            <div className="w-full px-4">
              <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-pink-900 text-white">

                {loadingColumns && (
                  <div className="flex items-center w-full justify-center py-3">
                    <Loader width={30} height={30} />
                  </div>
                )}

                {!active_board_id && (
                  <p className="p-4 text-gray text-sm">Select a board from left sidebar to load items</p>
                )}

                {(active_board_id && !loadingColumns) && (
                  <>
                    <div className="rounded-t mb-0 px-4 py-3 border-0">
                      <div className="flex flex-wrap items-center">
                        <div className="relative w-full px-4 max-w-full flex-grow flex-1 ">
                          <h3 className="font-semibold text-lg text-white">
                            {active_board_name != "" && (
                              <>{active_board_name}</>
                            )}
                          </h3>
                        </div>
                      </div>
                    </div>
                    <div className="block w-full overflow-x-auto ">
                      <table className="items-center w-full bg-transparent border-collapse">
                        <thead>
                          <tr>
                            {columns?.length > 0 && columns?.map((column, key) => {
                              return (
                                <th key={key} className="text-center w-fit align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold bg-pink-800 text-pink-300 border-pink-700">{column?.title}</th>
                              )
                            })}
                          </tr>
                        </thead>

                        {active_board?.length > 0 && (
                          // console.log(active_board, active_board_id,items_names)
                          <TableRow board_id={active_board_id} item_ids={active_board} length={columns?.length} />
                        )}


                        {/* <th className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left flex items-center">
                              <img src="https://demos.creative-tim.com/notus-js/assets/img/bootstrap.jpg" className="h-12 w-12 bg-white rounded-full border" alt="..." />
                              <span className="ml-3 font-bold text-white"> Argon Design System </span></th>
                            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">$2,500 USD</td>
                            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                              <i className="fas fa-circle text-orange-500 mr-2"></i>pending</td>
                            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                              <div className="flex">
                                <img src="https://demos.creative-tim.com/notus-js/assets/img/team-1-800x800.jpg" alt="..." className="w-10 h-10 rounded-full border-2 border-blueGray-50 shadow" />

                              </div>
                            </td>
                            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4"><div className="flex items-center">
                              <span className="mr-2">60%</span>
                              <div className="relative w-full">
                                <div className="overflow-hidden h-2 text-xs flex rounded bg-red-200">
                                  <div style={{ width: "60%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"></div>
                                </div>
                              </div>
                            </div>
                            </td>
                            <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-right">
                              <a href="#pablo" className="text-blueGray-500 block py-1 px-3" onclick="openDropdown(event,'table-dark-1-dropdown')">
                                <i className="fas fa-ellipsis-v"></i></a>
                              <div className="hidden bg-white text-base z-50 float-left py-2 list-none text-left rounded shadow-lg min-w-48" id="table-dark-1-dropdown">
                                <a href="#pablo" className="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-blueGray-700">Action</a><a href="#pablo" className="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-blueGray-700">Another action</a><a href="#pablo" className="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-blueGray-700">Something else here</a>
                                <div className="h-0 my-2 border border-solid border-blueGray-100"></div>
                                <a href="#pablo" className="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-blueGray-700">Seprated link</a>
                              </div>
                            </td>
                            */}
                      </table>
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

export default Workflow