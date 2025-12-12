import { useAuth } from '../context/AuthContext'
import { User, Mail, Calendar } from 'lucide-react'
import { formatDate } from '../utils/date'

function Profile() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">个人资料</h1>

      <div className="card">
        {/* Avatar */}
        <div className="flex items-center space-x-6 mb-6 pb-6 border-b border-gray-200">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-gray-700">
            <User size={20} className="text-gray-400" />
            <span>用户名：{user.username}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-700">
            <Mail size={20} className="text-gray-400" />
            <span>邮箱：{user.email}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-700">
            <Calendar size={20} className="text-gray-400" />
            <span>注册时间：{formatDate(user.created_at)}</span>
          </div>
        </div>

        {user.bio && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">个人简介</h3>
            <p className="text-gray-600">{user.bio}</p>
          </div>
        )}

        {user.github_url && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">GitHub</h3>
            <a
              href={user.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              {user.github_url}
            </a>
          </div>
        )}
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 提示</h3>
        <p className="text-blue-800 text-sm">
          当前版本不支持编辑个人资料，该功能将在未来版本中添加。
        </p>
      </div>
    </div>
  )
}

export default Profile