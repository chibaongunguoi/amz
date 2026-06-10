import { BaseEntity } from './BaseEntity';

export class Setting extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.content = data.content || '';
    this.endDate = data.endDate || null;
    this.topSellingImage1 = data.topSellingImage1 || '';
    this.topSellingImage2 = data.topSellingImage2 || '';
    this.hotDealImage1 = data.hotDealImage1 || '';
    this.hotDealImage2 = data.hotDealImage2 || '';
    this.bannerImages = Array.isArray(data.bannerImages) ? data.bannerImages : [];
  }

  static fromFirestore(doc) {
    const data = doc.data ? doc.data() : doc;
    return new Setting({ id: doc.id, ...data });
  }
}
