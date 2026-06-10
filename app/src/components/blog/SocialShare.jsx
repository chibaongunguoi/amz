import React from 'react';
import { 
  FacebookOutlined, 
  TwitterOutlined, 
  LinkOutlined,
  ShareAltOutlined 
} from '@ant-design/icons';

function SocialShare({ url, title, description }) {
  const encodedUrl = encodeURIComponent(url || window.location.href);
  const encodedTitle = encodeURIComponent(title || '');
  const encodedDescription = encodeURIComponent(description || '');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    copy: url || window.location.href,
  };

  const handleShare = (platform) => {
    if (platform === 'copy') {
      navigator.clipboard.writeText(shareLinks.copy).then(() => {
        // You can add a toast notification here
        alert('Đã sao chép link!');
      });
      return;
    }

    if (platform === 'native' && navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: url || window.location.href,
      }).catch(() => {});
      return;
    }

    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <ShareAltOutlined />
        <span>Chia sẻ bài viết</span>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => handleShare('facebook')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors duration-200 shadow-sm hover:shadow-md"
          aria-label="Chia sẻ lên Facebook"
        >
          <FacebookOutlined />
          <span className="hidden sm:inline">Facebook</span>
        </button>
        
        <button
          onClick={() => handleShare('twitter')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1A91DA] transition-colors duration-200 shadow-sm hover:shadow-md"
          aria-label="Chia sẻ lên Twitter"
        >
          <TwitterOutlined />
          <span className="hidden sm:inline">Twitter</span>
        </button>

        {navigator.share && (
          <button
            onClick={() => handleShare('native')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm hover:shadow-md"
            aria-label="Chia sẻ"
          >
            <ShareAltOutlined />
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>
        )}

        <button
          onClick={() => handleShare('copy')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 shadow-sm hover:shadow-md"
          aria-label="Sao chép link"
        >
          <LinkOutlined />
          <span className="hidden sm:inline">Sao chép link</span>
        </button>
      </div>
    </div>
  );
}

export default SocialShare;


