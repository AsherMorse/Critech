import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import CreateReviewPage from './pages/CreateReviewPage'
import VideoPreview from './pages/VideoPreview'
import ReviewOptionsPage from './pages/ReviewOptionsPage'
import EditReviewPage from './pages/EditReviewPage'
import ReviewDetailsPage from './pages/ReviewDetailsPage'
import { useAuth } from './contexts/AuthContext'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/create-review" element={user ? <CreateReviewPage /> : <Navigate to="/login" />} />
        <Route path="/video-preview" element={user ? <VideoPreview /> : <Navigate to="/login" />} />
        <Route path="/review-options" element={user ? <ReviewOptionsPage /> : <Navigate to="/login" />} />
        <Route path="/review/:id/edit" element={user ? <EditReviewPage /> : <Navigate to="/login" />} />
        <Route path="/reviews/:reviewId" element={<ReviewDetailsPage />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}
