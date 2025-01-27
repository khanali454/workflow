import App from '../App.jsx'
import {
  createBrowserRouter
} from "react-router-dom";
import { Callback } from '../pages/Callback.jsx';
import Workflow from '../pages/Workflow.jsx';
import Automation from '../pages/Automation.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/automation",
    element: <Automation />,
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