import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root")!;
// Clear static loading state before rendering React
rootElement.innerHTML = '';
createRoot(rootElement).render(<App />);
