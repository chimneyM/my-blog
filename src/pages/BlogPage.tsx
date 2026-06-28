import { useBlogStore } from '../stores/blogStore'
import PostCard from '../components/PostCard'

export default function BlogPage() {
  const filteredPosts = useBlogStore((s) => s.filteredPosts)
  const searchQuery = useBlogStore((s) => s.searchQuery)
  const selectedTag = useBlogStore((s) => s.selectedTag)
  const setSearchQuery = useBlogStore((s) => s.setSearchQuery)
  const setSelectedTag = useBlogStore((s) => s.setSelectedTag)
  const allTags = useBlogStore((s) => s.getAllTags())
  const posts = useBlogStore((s) => s.posts)

  return (
    <div className="blog-page">
      <div className="section-header">
        <h1>博客文章</h1>
        <span className="post-count">
          共 {filteredPosts.length} / {posts.length} 篇
        </span>
      </div>

      <div className="blog-controls">
        <input
          type="text"
          className="search-input"
          placeholder="搜索文章..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="tags-bar">
        <button
          className={`tag${selectedTag === null ? ' tag-active' : ''}`}
          onClick={() => setSelectedTag(null)}
        >
          全部
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            className={`tag${selectedTag === tag ? ' tag-active' : ''}`}
            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {filteredPosts.length > 0 ? (
        <div className="post-list">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>没有找到匹配的文章</p>
          {(searchQuery || selectedTag) && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('')
                setSelectedTag(null)
              }}
            >
              清除筛选
            </button>
          )}
        </div>
      )}
    </div>
  )
}
