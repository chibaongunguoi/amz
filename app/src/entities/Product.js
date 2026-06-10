import { BaseEntity } from './BaseEntity';
import { PRODUCT_STATUS, BESTSELLER_VALUES, PRODUCT_DEFAULTS, COLLECTION_TO_CATEGORY } from '../constants';

export class Product extends BaseEntity {
  static FIELD_INDICES = {
    CODE: 0,
    PAGE: 1,
    BRAND: 2,
    NAME: 3,
    COLOR: 4,
    PRICE_FOR_SALE: 5,
    PRICE_DEFAULT: 6,
    SALE_PERCENT: 7,
    IS_BESTSELLER: 8,
    CONDITION: 9,
    IMAGES: 10,
    DESCRIPTION: 11,
    TABLE_INFO: 13,
    VIDEO_URL: 14,
    POST: 15,
  };

  static DELIMITERS = {
    FIELD: '|',
    IMAGE: ';;',
    COLOR: ',',
  };

  constructor(data = {}) {
    super(data);
    this.name = data.name || '';
    this.brand = data.brand || '';
    this.category = data.category || '';
    this.collection = data.collection || '';
    this.status = data.status || PRODUCT_STATUS.ACTIVE;
    this.colors = Array.isArray(data.colors) ? data.colors : [];
    this.condition = Array.isArray(data.condition) ? data.condition : [];
    this.images = Array.isArray(data.images) ? data.images : [];
    this.priceDefault = Number(data.priceDefault) || PRODUCT_DEFAULTS.PRICE;
    this.priceForSale = Number(data.priceForSale) || PRODUCT_DEFAULTS.PRICE;
    this.salePercent = Number(data.salePercent) || PRODUCT_DEFAULTS.SALE_PERCENT;
    this.isBestSeller = data.isBestSeller || BESTSELLER_VALUES.NO;
    this.description = data.description || '';
    this.tableInfo = data.tableInfo || '';
    this.videoUrl = data.videoUrl || '';
    this.loaiSp = data.loaiSp || '';
    // Variants support
    this.variants = Array.isArray(data.variants) ? data.variants.map(v => ({
      id: v.id || `variant-${Date.now()}-${Math.random()}`,
      name: v.name || '',
      color: v.color || '',
      condition: v.condition || '',
      priceDefault: Number(v.priceDefault) || 0,
      priceForSale: Number(v.priceForSale) || 0,
      salePercent: Number(v.salePercent) || 0,
      inventory: Number(v.inventory) || 0,
      images: Array.isArray(v.images) ? v.images : [],
      sku: v.sku || '',
    })) : [];
  }

  static fromPipeString(value, collectionCode, categoryMapper) {
    if (!value || typeof value !== 'string') return null;
    
    const parts = value.split(Product.DELIMITERS.FIELD);
    const { FIELD_INDICES: F, DELIMITERS: D } = Product;
    
    // Parse variants from field 16 (index 16 after code and page are removed, so index 14 in parts array)
    // But since parts includes code and page, variants would be at index 16
    let variants = [];
    if (parts[16] && parts[16] !== 'null') {
      try {
        const parsed = JSON.parse(parts[16]);
        if (Array.isArray(parsed)) {
          variants = parsed;
        }
      } catch (e) {
        console.error('Error parsing variants in Product.fromPipeString:', e);
        variants = [];
      }
    }

    const pipeCode = parts[F.CODE];
    const resolvedCollection =
      pipeCode && COLLECTION_TO_CATEGORY[pipeCode] ? pipeCode : collectionCode;
    
    return new Product({
      name: parts[F.NAME] || '',
      brand: parts[F.BRAND] || '',
      category: categoryMapper(resolvedCollection),
      collection: resolvedCollection,
      status: PRODUCT_STATUS.ACTIVE,
      isBestSeller: parts[F.IS_BESTSELLER] || BESTSELLER_VALUES.NO,
      colors: parts[F.COLOR] ? parts[F.COLOR].split(D.COLOR) : [],
      condition: parts[F.CONDITION] ? [parts[F.CONDITION]] : [],
      priceDefault: Number(parts[F.PRICE_DEFAULT]) || PRODUCT_DEFAULTS.PRICE,
      priceForSale: Number(parts[F.PRICE_FOR_SALE]) || PRODUCT_DEFAULTS.PRICE,
      salePercent: Number(parts[F.SALE_PERCENT]) || PRODUCT_DEFAULTS.SALE_PERCENT,
      description: parts[F.DESCRIPTION] || '',
      images: parts[F.IMAGES] ? parts[F.IMAGES].split(D.IMAGE).filter(Boolean) : [],
      tableInfo: parts[F.TABLE_INFO] || '',
      videoUrl: parts[F.VIDEO_URL] || '',
      variants: variants,
      loaiSp: parts[17] && parts[17] !== 'null' ? String(parts[17]).trim() : '',
    });
  }

  toPipeString(code, page) {
    const { DELIMITERS: D } = Product;
    const fields = [
      code,
      page,
      this.brand || 'null',
      this.name || 'null',
      Array.isArray(this.colors) ? this.colors[0] : (this.colors || 'null'),
      this.priceForSale || 'null',
      this.priceDefault || 'null',
      this.salePercent || 'null',
      this.isBestSeller === BESTSELLER_VALUES.YES ? BESTSELLER_VALUES.YES : BESTSELLER_VALUES.NO,
      Array.isArray(this.condition) ? this.condition[0] : (this.condition || 'null'),
      Array.isArray(this.images) ? this.images.join(D.IMAGE) : 'null',
      this.description || 'null',
      'null',
      this.tableInfo || 'null',
      this.videoUrl || 'null',
    ];
    return fields.join(D.FIELD);
  }

  get isBestSellerBoolean() {
    return this.isBestSeller === BESTSELLER_VALUES.YES;
  }

  get isOnSale() {
    return this.salePercent > PRODUCT_DEFAULTS.SALE_PERCENT;
  }

  get finalPrice() {
    // priceForSale đã là giá cuối (đã giảm) theo convention admin form.
    return this.priceForSale || PRODUCT_DEFAULTS.PRICE;
  }

  get primaryColor() {
    return this.colors.length > 0 ? this.colors[0] : null;
  }

  get primaryImage() {
    return this.images.length > 0 ? this.images[0] : null;
  }

  // Variant methods
  get hasVariants() {
    return Array.isArray(this.variants) && this.variants.length > 0;
  }

  getVariantFinalPrice(variant) {
    if (!variant) return this.finalPrice;
    // variant.priceForSale đã là giá cuối (đã giảm) theo convention admin form.
    return Number(variant.priceForSale) || 0;
  }

  getVariantById(variantId) {
    if (!this.hasVariants) return null;
    return this.variants.find(v => v.id === variantId) || null;
  }

  isVariantInStock(variant) {
    if (!variant) return false;
    return Number(variant.inventory) > 0;
  }

  getDefaultVariant() {
    if (!this.hasVariants) return null;
    // Trả về variant đầu tiên có tồn kho, hoặc variant đầu tiên
    return this.variants.find(v => this.isVariantInStock(v)) || this.variants[0] || null;
  }

  validate() {
    const errors = [];
    if (!this.name) errors.push('Name is required');
    if (!this.brand) errors.push('Brand is required');
    if (this.priceForSale < 0) errors.push('Price must be positive');
    return { isValid: errors.length === 0, errors };
  }
}
