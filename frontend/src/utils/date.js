export function formatDistanceToNow(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  const intervals = [
    { label: '年', seconds: 31536000 },
    { label: '个月', seconds: 2592000 },
    { label: '天', seconds: 86400 },
    { label: '小时', seconds: 3600 },
    { label: '分钟', seconds: 60 }
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count}${interval.label}前`
    }
  }

  return '刚刚'
}

export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}