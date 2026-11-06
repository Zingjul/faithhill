import { useEffect, useState, type ReactNode } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { fetchAll, serviceLine, type ServiceTime } from "./api";
import Footer from "./components/Footer";
import { ServiceTimesContext, useServiceTimes } from "./serviceTimes";
import Header, { MenuProvider } from "./components/Header";
import { ModalProvider } from "./components/modals";
import About from "./pages/About";
import Calendar from "./pages/Calendar";
import Give from "./pages/Give";
import Home from "./pages/Home";
import MessageDetail from "./pages/MessageDetail";
import Messages from "./pages/Messages";
import NextSteps from "./pages/NextSteps";
import Prayer from "./pages/Prayer";
import Team from "./pages/Team";
import Visit from "./pages/Visit";



function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function Shell({ children }: { children: ReactNode }) {
  const times = useServiceTimes();
  return (
    <>
      <Header />
      {children}
      <Footer serviceLabel={serviceLine(times)} />
    </>
  );
}

export default function App() {
  const [times, setTimes] = useState<ServiceTime[]>([]);

  useEffect(() => {
    fetchAll<ServiceTime>("/api/service-times/")
      .then(setTimes)
      .catch(() => setTimes([]));
  }, []);

  return (
    <ServiceTimesContext.Provider value={times}>
      <MenuProvider>
        <ModalProvider>
          <ScrollToTop />
          <Shell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/visit" element={<Visit />} />
              <Route path="/next-steps" element={<NextSteps />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:slug" element={<MessageDetail />} />
              <Route path="/team" element={<Team />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/give" element={<Give />} />
              <Route path="/pray" element={<Prayer />} />
              <Route
                path="*"
                element={
                  <div className="error-page">
                    <h1 className="h-lg">Page not found</h1>
                    <p className="lede center" style={{ marginTop: "0.6rem" }}>
                      The page you’re looking for doesn’t exist.
                    </p>
                  </div>
                }
              />
            </Routes>
          </Shell>
        </ModalProvider>
      </MenuProvider>
    </ServiceTimesContext.Provider>
  );
}
