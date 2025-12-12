import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import SnippetDetail from './pages/SnippetDetail'
import CreateSnippet from './pages/CreateSnippet'
import MySnippets from './pages/MySnippets'
import Favorites from './pages/Favorites'
import Profile from './pages/Profile'

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="snippet/:id" element={<SnippetDetail />} />
        <Route path="login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="register" element={user ? <Navigate to="/" /> : <Register />} />
        
        {/* 需要登录的路由 */}
        <Route path="create" element={user ? <CreateSnippet /> : <Navigate to="/login" />} />
        <Route path="my-snippets" element={user ? <MySnippets /> : <Navigate to="/login" />} />
        <Route path="favorites" element={user ? <Favorites /> : <Navigate to="/login" />} />
        <Route path="profile" element={user ? <Profile /> : <Navigate to="/login" />} />
      </Route>
    </Routes>
  )
}

export default App