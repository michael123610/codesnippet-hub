import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { snippetAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import CodeEditor from '../components/CodeEditor'
import { Heart, Bookmark, Eye, Calendar, User, Trash2, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from '../utils/date'
import toast from 'react-hot-toast'

function SnippetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [snippet, setSnippet] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSnippet()
  }, [id])

  const loadSnippet = async () => {
    try {
      setLoading(true)
      const data = await snippetAPI.getById(id)
      setSnippet(data)
    } catch (error) {
      toast.error('加载失败')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user) {
      toast.error('请先登录')
      return
    }
    try {
      const result = await snippetAPI.like(id)
      setSnippet({
        ...snippet,
        isLiked: result.liked,
        likes_count: result.liked ? snippet.likes_count + 1 : snippet.likes_count - 1
      })
      toast.success(result.liked ? '点赞成功' : '取消点赞')
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleFavorite = async () => {
    if (!user) {
      toast.error('请先登录')
      return
    }
    try {
      const result = await snippetAPI.favorite(id)
      setSnippet({ ...snippet, isFavorited: result.favorited })
      toast.success(result.favorited ? '收藏成功' : '取消收藏')
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('确认删除这个代码片段吗？')) return

    try {
      await snippetAPI.delete(id)
      toast.success('删除成功')
      navigate('/my-snippets')
    } catch (error) {
      toast.error('删除失败')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!snippet) return null

  const isOwner = user && user.id === snippet.user_id

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="btn btn-secondary flex items-center space-x-2">
        <ArrowLeft size={18} />
        <span>返回</span>
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{snippet.title}</h1>
            {snippet.description && (
              <p className="text-gray-600">{snippet.description}</p>
            )}
          </div>
          <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-lg text-sm font-medium">
            {snippet.language}
          </span>
        </div>

        {/* Tags */}
        {snippet.tags && snippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {snippet.tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-6 text-gray-600">
            <div className="flex items-center space-x-2">
              <User size={18} />
              <span>{snippet.username}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart size={18} />
              <span>{snippet.likes_count || 0} 点赞</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye size={18} />
              <span>{snippet.views || 0} 浏览</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={18} />
              <span>{formatDistanceToNow(snippet.created_at)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {user && (
              <>
                <button
                  onClick={handleLike}
                  className={`btn ${snippet.isLiked ? 'btn-primary' : 'btn-secondary'} flex items-center space-x-2`}
                >
                  <Heart size={18} fill={snippet.isLiked ? 'currentColor' : 'none'} />
                  <span>{snippet.isLiked ? '已点赞' : '点赞'}</span>
                </button>
                <button
                  onClick={handleFavorite}
                  className={`btn ${snippet.isFavorited ? 'btn-primary' : 'btn-secondary'} flex items-center space-x-2`}
                >
                  <Bookmark size={18} fill={snippet.isFavorited ? 'currentColor' : 'none'} />
                  <span>{snippet.isFavorited ? '已收藏' : '收藏'}</span>
                </button>
              </>
            )}
            {isOwner && (
              <button onClick={handleDelete} className="btn bg-red-600 text-white hover:bg-red-700 flex items-center space-x-2">
                <Trash2 size={18} />
                <span>删除</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Code */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900">代码</h2>
        <CodeEditor value={snippet.code} language={snippet.language} readOnly height="600px" />
      </div>

      {/* Author Info */}
      {snippet.bio && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 text-gray-900">关于作者</h2>
          <p className="text-gray-600">{snippet.bio}</p>
        </div>
      )}
    </div>
  )
}

export default SnippetDetail