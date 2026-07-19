import { createBrowserRouter } from "react-router";
import Root from "./Root";
import LoginPage from "./pages/LoginPage";
import RecordPage from "./pages/RecordPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LoginPage },
      { path: "login", Component: LoginPage },
      { path: "record", Component: RecordPage },
    ],
  },
]);
