import React from "react";
import AppRoutes from "./routes/AppRoutes";
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext'; 

function App(){
  return (
      <ThemeProvider>
      <div className="App">
        <AppRoutes />
      </div>
    </ThemeProvider>
  );
}

export default App;