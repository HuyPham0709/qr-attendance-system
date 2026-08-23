import { Routes, Route } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout.jsx";
import EventsList from "./pages/EventsList.jsx";
import EventRegister from "./pages/EventRegister.jsx";
import LookupTickets from "./pages/LookupTickets.jsx";

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<EventsList />} />
        <Route path="/events/:id" element={<EventRegister />} />
        <Route path="/lookup" element={<LookupTickets />} />
      </Route>
    </Routes>
  );
}

export default App;
