import { BaseEntity } from './BaseEntity';
import { POST_STATUS, POST_CATEGORY } from '../constants';

export class Post extends BaseEntity {
  constructor(data = {}) {
    super(data);
    // Core content fields
    this.title = data.title || '';
    this.slug = data.slug || this.generateSlug(data.title || '');
    this.content = data.content || '';
    this.excerpt = data.excerpt || '';
    
    // Media fields
    this.thumbnail = data.thumbnail || '';
    this.featuredImage = data.featuredImage || data.thumbnail || '';
    
    // Author fields
    this.author = data.author || '';
    this.authorName = data.authorName || data.author || '';
    this.authorAvatar = data.authorAvatar || '';
    this.authorBio = data.authorBio || '';
    
    // Status and metadata
    this.status = data.status || POST_STATUS.DRAFT;
    this.tags = Array.isArray(data.tags) ? data.tags : [];
    this.category = data.category || POST_CATEGORY.NONE;
    this.views = Number(data.views) || 0;
    
    // Date fields
    this.publishedAt = data.publishedAt || data.date || null;
    this.updatedAt = data.updatedAt || data.date || null;
    this.date = data.date || data.publishedAt || null; // Keep for backward compatibility
    
    // SEO fields
    this.metaDescription = data.metaDescription || data.excerpt || '';
    this.metaKeywords = Array.isArray(data.metaKeywords) ? data.metaKeywords : [];
    
    // Reading time (calculated or provided)
    this.readingTime = data.readingTime || this.calculateReadingTime(data.content || '');
    
    // Related content
    this.relatedPostIds = Array.isArray(data.relatedPostIds) ? data.relatedPostIds : [];
    
    // Additional metadata
    this.featured = Boolean(data.featured) || false;
    this.pinned = Boolean(data.pinned) || false;
  }

  static fromFirestore(doc) {
    const data = doc.data ? doc.data() : doc;
    return new Post({ id: doc.id, ...data });
  }

  generateSlug(title) {
    if (!title) return '';
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  calculateReadingTime(content) {
    if (!content) return 0;
    // Remove HTML tags
    const text = content.replace(/<[^>]*>/g, '');
    // Average reading speed: 200 words per minute (Vietnamese)
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes;
  }

  get isPublished() {
    return this.status === POST_STATUS.PUBLISHED;
  }

  get isDraft() {
    return this.status === POST_STATUS.DRAFT;
  }

  get isArchived() {
    return this.status === POST_STATUS.ARCHIVED;
  }

  get readingTimeText() {
    if (this.readingTime <= 0) return '';
    return `${this.readingTime} phút đọc`;
  }

  validate() {
    const errors = [];
    if (!this.title) errors.push('Title is required');
    if (!this.content) errors.push('Content is required');
    if (!this.slug) errors.push('Slug is required');
    return { isValid: errors.length === 0, errors };
  }
}
