/* Teaching guide: This file contains app application logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from ./routes/AppRoutes.
import AppRoutes from "./routes/AppRoutes";

// Loads ./App.css styles or setup.
import "./App.css";

// Shows the app.
const App = () => {
  // Builds the visible interface below.
  return (
    <div className="app">
      <AppRoutes />
    </div>
  );
};

export default App;