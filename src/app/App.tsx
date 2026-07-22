import { RouterProvider } from "react-router";
import React from "react";
import { router } from "./routes";

export default function App() {
  return <RouterProvider router={router} />;
}
