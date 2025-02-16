import App from '../App.jsx'
import {
  createBrowserRouter
} from "react-router-dom";
import { Callback } from '../pages/Callback.jsx';
import Workflow from '../pages/Workflow.jsx';
import Automations from '../pages/Automations.jsx';
import NewAutomation from '../pages/NewAutomation.jsx';
import Webhooks from '../pages/Webhooks.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/automation/new",
    element: <NewAutomation />,
  },
  {
    path: "/automations/:board_id",
    element: <Automations />,
  },
  {
    path: "/webhooks/:board_id",
    element: <Webhooks />,
  },
  {
    path: "/oauth/callback",
    element: <Callback/>,
  },
  {
    path: "/monday/app",
    element: <Workflow/>,
  },
]);

export default router