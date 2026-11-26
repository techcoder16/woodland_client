import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applySavedTextSize } from './components/layout/TextSizeToggle'

applySavedTextSize()

createRoot(document.getElementById("root")!).render(<App />);
