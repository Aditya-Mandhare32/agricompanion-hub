import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/pushNotifications";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA + push notifications (skipped in preview/iframe).
registerServiceWorker();
