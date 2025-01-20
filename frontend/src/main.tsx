import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import JoinRoom from "./routes/JoinRoom";
import Room from "./routes/Room";
import { ThemeProvider } from "./components/theme-provider";
import Layout from "./components/layout";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<JoinRoom />} />
            <Route path="/:roomId" element={<JoinRoom />} />
            <Route path="/room/:roomId" element={<Room />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
