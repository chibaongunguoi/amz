export class BaseEntity {
  constructor(data = {}) {
    this.id = data.id || null;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(doc) {
    return new this({ id: doc.id, ...doc.data() });
  }

  toPlainObject() {
    return Object.entries(this).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) acc[key] = value;
      return acc;
    }, {});
  }

  clone(overrides = {}) {
    return new this.constructor({ ...this.toPlainObject(), ...overrides });
  }

  validate() {
    return { isValid: true, errors: [] };
  }
}
