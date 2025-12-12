import { Link } from 'react-router-dom'
import { Heart, Eye, Calendar, User } from 'lucide-react'
import { formatDistanceToNow } from '../utils/date'

function SnippetCard({ snippet }) {
  const getLanguageColor = (lang) => {
    const colors = {
      javascript: 'bg-yellow-100 text-yellow-800',
      typescript: 'bg-blue-100 text-blue-800',
      python: 'bg-green-100 text-green-800',
      java: 'bg-red-100 text-red-800',
      cpp: 'bg-purple-100 text-purple-800',
      'c++': 'bg-purple-100 text-purple-800',
      html: 'bg-orange-100 text-orange-800',
      css: 'bg-pink-100 text-pink-800',
      default: 'bg-gray-100 text-gray-800'
    }
    return colors[lang?.toLowerCase()] || colors.default
  }

  return (
    <Link
      to={`/snippet/${snippet.id}`}
      className="card hover:shadow-lg transition-shadow duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
          {snippet.title}
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getLanguageColor(snippet.language)}`}>
          {snippet.language}
        </span>
      </div>

      {/* Description */}
      {snippet.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {snippet.description}
        </p>
      )}

      {/* Code Preview */}
      <div className="bg-gray-900 rounded-lg p-3 mb-4 overflow-hidden">
        <pre className="text-xs text-gray-300 line-clamp-3 overflow-x-auto">
          <code>{snippet.code}</code>
        </pre>
      </div>

      {/* Tags */}
      {snippet.tags && snippet.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {snippet.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              #{tag}
            </span>
          ))}
          {snippet.tags.length > 3 && (
            <span className="px-2 py-1 text-gray-500 text-xs">
              +{snippet.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <User size={14} />
            <span>{snippet.username}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart size={14} />
            <span>{snippet.likes_count || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye size={14} />
            <span>{snippet.views || 0}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar size={14} />
          <span>{formatDistanceToNow(snippet.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}

export default SnippetCard