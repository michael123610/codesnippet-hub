import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { snippetAPI } from '../services/api'
import CodeEditor from '../components/CodeEditor'
import toast from 'react-hot-toast'
import { Save, X } from 'lucide-react'

function CreateSnippet() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    language: 'javascript',
    isPublic: true,
    tags: ''
  })
  const [loading, setLoading] = useState(false)

  const languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 
    'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'HTML', 'CSS'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.code.trim()) {
      toast.error('请填写标题和代码')
      return
    }

    try {
      setLoading(true)
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      await snippetAPI.create({
        ...formData,
        tags
      })
      
      toast.success('创建成功！')
      navigate('/my-snippets')
    } catch (error) {
      console.error('创建失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">创建代码片段</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              placeholder="给你的代码片段起个名字..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
            <textarea
              rows={3}
              placeholder="简要描述这段代码的作用..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
            />
          </div>

          {/* 语言 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              编程语言 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="input"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* 代码编辑器 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              代码 <span className="text-red-500">*</span>
            </label>
            <CodeEditor
              value={formData.code}
              onChange={(value) => setFormData({ ...formData, code: value })}
              language={formData.language}
              height="500px"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签（用逗号分隔）
            </label>
            <input
              type="text"
              placeholder="例如: React, Hooks, 前端"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="input"
            />
          </div>

          {/* 公开/私有 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
              公开分享（他人可以查看）
            </label>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save size={18} />
              <span>{loading ? '创建中...' : '创建'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <X size={18} />
              <span>取消</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateSnippet