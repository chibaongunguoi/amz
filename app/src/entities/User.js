import { BaseEntity } from './BaseEntity';
import { USER_ROLES, USER_STATUS } from '../constants';

export class User extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.email = data.email || '';
    this.displayName = data.displayName || '';
    this.photoURL = data.photoURL || '';
    this.role = data.role || USER_ROLES.USER;
    this.status = data.status || USER_STATUS.ACTIVE;
    this.lastLoginAt = data.lastLoginAt || null;
  }

  static fromFirebaseUser(firebaseUser) {
    if (!firebaseUser) return null;
    return new User({
      id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    });
  }

  get isAdmin() {
    return this.role === USER_ROLES.ADMIN;
  }

  get isActive() {
    return this.status === USER_STATUS.ACTIVE;
  }

  validate() {
    const errors = [];
    if (!this.email) errors.push('Email is required');
    return { isValid: errors.length === 0, errors };
  }
}
