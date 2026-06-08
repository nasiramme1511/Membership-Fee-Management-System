import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save, Upload, Trash2, Image, Edit3, Eye, X, Globe, RefreshCw,
  FileText, CheckCircle, AlertCircle, ArrowUp, ArrowDown, ToggleLeft,
  ToggleRight, ExternalLink, Home, Star, LayoutDashboard, Info,
  Sparkles, Copy, Check
} from 'lucide-react'
import api from '../lib/api'
import PageLoader from '../components/PageLoader'

interface LandingImage {
  id: number
  title: string
  description: string
  image: string
  category: string
  displayOrder: number
  isActive: boolean
  createdAt: string
}

interface ContentMap {
  [key: string]: string
}

const categories = [
  { value: 'hero', label: 'Hero / Background', icon: LayoutDashboard, desc: 'Full-screen hero background image' },
  { value: 'leadership', label: 'Leadership', icon: Star, desc: 'Leadership/executive office photograph' },
  { value: 'gallery', label: 'Gallery', icon: Image, desc: 'Community & events gallery photos' },
  { value: 'event', label: 'Event', icon: Sparkles, desc: 'Special event photography' }
]

const contentFields = [
  { key: 'hero_title', label: 'Hero Title', type: 'text' },
  { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'text' },
  { key: 'hero_description', label: 'Hero Description', type: 'textarea' },
  { key: 'about_title', label: 'About Title', type: 'text' },
  { key: 'about_description', label: 'About Description', type: 'textarea' },
  { key: 'mission_text', label: 'Mission Text', type: 'textarea' },
  { key: 'vision_text', label: 'Vision Text', type: 'textarea' },
  { key: 'leadership_message', label: 'Leadership Message', type: 'textarea' },
  { key: 'leadership_name', label: 'Leadership Executive Name', type: 'text' },
  { key: 'leadership_role', label: 'Leadership Executive Role', type: 'text' },
  { key: 'ai_title', label: 'AI Section Title', type: 'text' },
  { key: 'ai_description', label: 'AI Section Description', type: 'textarea' },
  { key: 'stats_title', label: 'Stats Section Title', type: 'text' },
  { key: 'cta_title', label: 'CTA Title', type: 'text' },
  { key: 'cta_subtitle', label: 'CTA Subtitle', type: 'text' },
  { key: 'cta_description', label: 'CTA Description', type: 'textarea' },
  { key: 'footer_description', label: 'Footer Description', type: 'textarea' },
  { key: 'address', label: 'Address', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'map_embed_url', label: 'Google Maps Embed URL (Iframe src)', type: 'textarea' },
]

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '') || ''

export default function LandingPageManager() {
  const [images, setImages] = useState<LandingImage[]>([])
  const [content, setContent] = useState<ContentMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('images')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', category: 'gallery' })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<ContentMap>({})
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [contentRes, imagesRes] = await Promise.all([
        api.get('/landing/content'),
        api.get('/landing/admin/images')
      ])
      if (contentRes.data.success) {
        setContent(contentRes.data.data.content || {})
        setEditContent(contentRes.data.data.content || {})
      }
      if (imagesRes.data.success) setImages(imagesRes.data.data)
    } catch (err) {
      showMessage('error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleUpload = async () => {
    if (!fileRef.current?.files?.length) {
      showMessage('error', 'Please select an image file')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', fileRef.current.files[0])
      formData.append('title', uploadForm.title)
      formData.append('description', uploadForm.description)
      formData.append('category', uploadForm.category)

      const res = await api.post('/landing/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.success) {
        showMessage('success', 'Image uploaded successfully')
        setUploadForm({ title: '', description: '', category: 'gallery' })
        if (fileRef.current) fileRef.current.value = ''
        setPreviewUrl(null)
        fetchData()
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (id: number) => {
    if (!confirm('Delete this image? This cannot be undone.')) return
    try {
      const res = await api.delete(`/landing/images/${id}`)
      if (res.data.success) {
        showMessage('success', 'Image deleted')
        fetchData()
      }
    } catch (err) {
      showMessage('error', 'Delete failed')
    }
  }

  const handleSaveContent = async () => {
    setSaving(true)
    try {
      const res = await api.put('/landing/content', { updates: editContent })
      if (res.data.success) {
        setContent(res.data.data)
        showMessage('success', 'Content updated successfully. Changes are live.')
      }
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = () => {
    const file = fileRef.current?.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const toggleActive = async (img: LandingImage) => {
    try {
      await api.put(`/landing/images/${img.id}`, { isActive: !img.isActive })
      showMessage('success', `Image ${img.isActive ? 'deactivated' : 'activated'}`)
      fetchData()
    } catch {
      showMessage('error', 'Update failed')
    }
  }

  const copyImageUrl = (url: string, id: number) => {
    navigator.clipboard.writeText(BASE_URL + url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) return <PageLoader />

  const filteredImages = categoryFilter === 'all'
    ? images
    : images.filter(i => i.category === categoryFilter)

  const tabs = [
    { id: 'images', label: 'Image Gallery', icon: Image },
    { id: 'upload', label: 'Upload Image', icon: Upload },
    { id: 'content', label: 'Edit Content', icon: Edit3 },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-outfit">Landing Page Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Manage images, gallery, content, and site statistics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" rel="noreferrer"
            className="btn btn-secondary flex items-center gap-2 text-xs">
            <Eye className="w-4 h-4" />
            View Live Site
          </a>
          <button onClick={fetchData} className="btn btn-ghost flex items-center gap-2 text-xs">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm">{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto">
              <X className="w-4 h-4 opacity-50 hover:opacity-100" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="card">
        {/* ── TAB: IMAGE GALLERY ─────────────────────── */}
        {activeTab === 'images' && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold font-outfit">All Images ({images.length})</h2>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  {[{ value: 'all', label: 'All' }, ...categories].map(cat => (
                    <button key={cat.value} onClick={() => setCategoryFilter(cat.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        categoryFilter === cat.value
                          ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredImages.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Image className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No images found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {categoryFilter !== 'all'
                    ? `No images in the "${categories.find(c => c.value === categoryFilter)?.label}" category`
                    : 'Upload your first image to get started'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredImages.map(img => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`group relative bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border transition-all duration-300 ${
                      img.isActive
                        ? 'border-gray-200 dark:border-gray-700'
                        : 'border-red-200 dark:border-red-900/30 opacity-70'
                    }`}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={img.image}
                        alt={img.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={img.image} target="_blank" rel="noreferrer"
                          className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white transition-all shadow-lg">
                          <Eye className="w-4 h-4" />
                        </a>
                        <button onClick={() => copyImageUrl(img.image, img.id)}
                          className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white transition-all shadow-lg">
                          {copiedId === img.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button onClick={() => toggleActive(img)}
                          className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white transition-all shadow-lg">
                          {img.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDeleteImage(img.id)}
                          className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate font-outfit">
                            {img.title || 'Untitled'}
                          </h3>
                          <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                            img.isActive
                              ? 'bg-primary/10 text-primary'
                              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {img.isActive ? 'Active' : 'Inactive'} | {img.category}
                          </span>
                        </div>
                      </div>
                      {img.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{img.description}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: UPLOAD ──────────────────────────────── */}
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold font-outfit">Upload New Image</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Images are automatically optimized for the landing page. Supported: JPG, PNG, WEBP (max 10MB)
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Select Image</label>
                <div
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
                    previewUrl
                      ? 'border-primary/50 bg-primary/[0.02]'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-primary/[0.02]'
                  }`}
                  onClick={() => fileRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="space-y-3">
                      <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-xl shadow-lg" />
                      <p className="text-xs text-gray-400">Click to change image</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Click to select an image</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — Max 10MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text" value={uploadForm.title}
                    onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
                    className="input" placeholder="e.g. Main Building, Entrance Gate" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={uploadForm.category}
                    onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}
                    className="input">
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label} — {cat.desc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {uploadForm.category && (
                <div className={`p-3 rounded-lg text-xs ${
                  uploadForm.category === 'hero'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : uploadForm.category === 'leadership'
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                }`}>
                  <strong>Usage:</strong> {categories.find(c => c.value === uploadForm.category)?.desc || ''}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={uploadForm.description}
                  onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
                  className="input" rows={3} placeholder="Optional description of the image" />
              </div>

              <button onClick={handleUpload} disabled={uploading || !previewUrl}
                className={`btn flex items-center gap-2 w-full justify-center py-3 ${
                  uploading || !previewUrl ? 'btn-secondary cursor-not-allowed' : 'btn-primary'
                }`}>
                {uploading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Upload Image</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: CONTENT ─────────────────────────────── */}
        {activeTab === 'content' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold font-outfit">Edit Landing Page Content</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Changes are published immediately — no save button needed for instant preview
                </p>
              </div>
              <button onClick={handleSaveContent} disabled={saving}
                className="btn btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contentFields.map(field => (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea value={editContent[field.key] || ''}
                      onChange={e => setEditContent(f => ({ ...f, [field.key]: e.target.value }))}
                      className="input" rows={4} placeholder={`Enter ${field.label.toLowerCase()}...`} />
                  ) : (
                    <input type="text" value={editContent[field.key] || ''}
                      onChange={e => setEditContent(f => ({ ...f, [field.key]: e.target.value }))}
                      className="input" placeholder={`Enter ${field.label.toLowerCase()}...`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={handleSaveContent} disabled={saving}
                className="btn btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-gradient-to-r from-primary/5 to-gold/5 border border-primary/10 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Globe className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 font-outfit">Live Publishing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All changes are published immediately — no deployment or rebuild required.
              Visit the <a href="/" target="_blank" className="font-bold text-primary hover:underline">live landing page</a> to see your updates in real-time.
              Statistics are fetched directly from the database and reflect current data.
            </p>
            <div className="flex flex-wrap gap-6 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Live Updates
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Auto-published
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                No Code Required
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
