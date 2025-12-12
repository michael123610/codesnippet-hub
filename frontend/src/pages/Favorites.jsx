import { useState, useEffect } from 'react'
import { userAPI } from '../services/api'
import SnippetCard from '../components/SnippetCard'
import toast from 'react-hot-toast'

function Favorites() {
  const [snippets, setSnippets] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 })

  useEffect(() => {
    loadFavorites()
  }, [pagination.page])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const data = await userAPI.getFavorites({
        page: pagination.page,
        limit: pagination.limit
      })
      setSnippets(data.snippets)
      setPagination(data.pagination)
    } catch (error) {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900">我的收藏</h1>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      ) : snippets.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-600 text-lg">还没有收藏任何代码片段</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {snippets.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-4 py-2 text-gray-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-secondary disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Favorites