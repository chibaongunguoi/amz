import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import OptimizedImage from '@/components/common/OptimizedImage';

function AuthorBio({ author, authorName, authorAvatar, authorBio }) {
  const displayName = authorName || author || 'Tác giả';
  const displayBio = authorBio || '';

  if (!displayName && !displayBio) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {authorAvatar ? (
            <OptimizedImage
              src={authorAvatar}
              alt={displayName}
              width={64}
              height={64}
              sizes="64px"
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D65312] to-[#FF8C42] flex items-center justify-center border-2 border-white shadow-md">
              <UserOutlined className="text-white text-2xl" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900">Về tác giả</h3>
          </div>
          <h4 className="text-base font-semibold text-[#D65312] mb-2">
            {displayName}
          </h4>
          {displayBio && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {displayBio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthorBio;

