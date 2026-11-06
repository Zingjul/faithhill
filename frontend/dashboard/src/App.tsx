import { Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth";
import AppShell from "./components/AppShell";
import DashboardHome from "./pages/DashboardHome";
import LoginPage from "./pages/LoginPage";
import ResourceFormPage from "./pages/ResourceFormPage";
import ResourceListPage from "./pages/ResourceListPage";
import ContactMessagesPage from "./pages/inbox/ContactMessagesPage";
import NewsletterPage from "./pages/inbox/NewsletterPage";
import PrayerRequestsPage from "./pages/inbox/PrayerRequestsPage";
import RsvpsPage from "./pages/inbox/RsvpsPage";
import TestimoniesPage from "./pages/inbox/TestimoniesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="r/:resourceKey" element={<ResourceListPage />} />
        <Route path="r/:resourceKey/new" element={<ResourceFormPage />} />
        <Route path="r/:resourceKey/:id/edit" element={<ResourceFormPage />} />
        <Route path="inbox/prayer-requests" element={<PrayerRequestsPage />} />
        <Route path="inbox/contact-messages" element={<ContactMessagesPage />} />
        <Route path="inbox/rsvps" element={<RsvpsPage />} />
        <Route path="inbox/testimonies" element={<TestimoniesPage />} />
        <Route path="inbox/newsletter" element={<NewsletterPage />} />
        <Route path="*" element={<div className="empty">Page not found.</div>} />
      </Route>
    </Routes>
  );
}
