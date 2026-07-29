import { cn } from './lib/utils';
import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Library from './pages/Library';
import ReviewSession from './pages/ReviewSession';
import NewNote from './pages/NewNote';
import Analytics from './pages/Analytics';
import AuthSuccess from './pages/AuthSuccess';
import VerifyEmail from './pages/VerifyEmail';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from './context/UserContext';

const AppContent = () => {
  const location = useLocation();
  const { isAuthenticated, isAuthLoading } = useUser();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname.startsWith('/auth/');
  const isReviewPage = location.pathname === '/review';
  const isLandingPage = location.pathname === '/';
  const showLayout = !isAuthPage && !isReviewPage && !isLandingPage;
  const isPrivateRoute = ['/dashboard', '/library', '/new', '/analytics', '/settings'].some((path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  ) || isReviewPage;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-slate-600 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (isPrivateRoute && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className={cn(
      "min-h-screen bg-background text-on-surface transition-colors duration-300",
      showLayout ? "flex" : "block"
    )}>
      {showLayout && <Sidebar />}
      <div className={cn("flex-1", showLayout ? "ml-64" : "")}>
        {showLayout && <Header />}
        <main className={showLayout ? "pt-16 pb-2" : ""}>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/auth/verify" element={<VerifyEmail />} />
            <Route path="/auth/success" element={<AuthSuccess />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/new" element={<NewNote />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/review" element={<ReviewSession />} />
            <Route
              path="*"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </UserProvider>
  );
}

export default App;
