import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./app/store";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./index.css";
import "leaflet/dist/leaflet.css";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ffb300" },
    secondary: { main: "#38bdf8" },
    background: { default: "#0b0f19", paper: "#121a2a" },
  },
  shape: { borderRadius: 14 },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Provider store={store}>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </Provider>
    </ThemeProvider>
  </React.StrictMode>
);
