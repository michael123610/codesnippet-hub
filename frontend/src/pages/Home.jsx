import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import { snippetAPI, tagAPI } from '../services/api'
import SnippetCard from '../components/SnippetCard'
import toast from 'react-hot-toast'

function Home() {
  const [snippets, setSnippets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [popularTags, setPopularTags] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 })

  const languages = ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'HTML', 'CSS', 'Go', 'Rust', 'PHP']

  useEffect(() => {
    loadSnippets()
    loadPopularTags()
  }, [pagination.page, language, selectedTag])

  const loadSnippets = async () => {
    try {
      setLoading(true)
      const data = await snippetAPI.getList({
        page: pagination.page,
        limit: pagination.limit,
        search,
        language,
        tag: selectedTag
      })
      setSnippets(data.snippets)
      setPagination(data.pagination)
    } catch (error) {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadPopularTags = async () => {
    try {
      const tags = await tagAPI.getPopular(10)
      setPopularTags(tags)
    } catch (error) {
      console.error('加载标签失败:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    loadSnippets()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl text-white">
        <h1 className="text-4xl font-bold mb-4">🚀 代码片段分享平台</h1>
        <p className="text-lg opacity-90">发现、分享、协作 - 让代码更有价值</p>
      </div>

      {/* Search and Filters */}
      <div className="card space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索代码片段..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            搜索
          </button>
        </form>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">编程语言:</span>
          </div>
          <button
            onClick={() => {
              setLanguage('')
              setPagination({ ...pagination, page: 1 })
            }}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              language === '' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang)
                setPagination({ ...pagination, page: 1 })
              }}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                language === lang ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Popular Tags */}
        {popularTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">热门标签:</span>
            {popularTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  setSelectedTag(tag.name)
                  setPagination({ ...pagination, page: 1 })
                }}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedTag === tag.name
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                #{tag.name} ({tag.usage_count})
              </button>
            ))}
            {selectedTag && (
              <button
                onClick={() => {
                  setSelectedTag('')
                  setPagination({ ...pagination, page: 1 })
                }}
                className="text-xs text-red-600 hover:underline"
              >
                清除
              </button>
            )}
          </div>
        )}
      </div>

      {/* Snippets Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      ) : snippets.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-600 text-lg">没有找到相关代码片段</p>
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

export default Home