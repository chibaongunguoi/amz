/**
 * Loading Component - Global loading spinner
 * Gộp từ 2 component Loading cũ
 */
import React from 'react';
import { Spin } from 'antd';

/**
 * @param {Object} props
 * @param {string} props.tip - Loading message
 * @param {boolean} props.fullScreen - Whether to cover full screen
 * @param {string} props.size - Spin size ('small', 'default', 'large')
 */
function Loading({ tip = 'Đang tải...', fullScreen = true, size = 'large' }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
        <Spin size={size} tip={tip}>
          <div className="p-12" />
        </Spin>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <Spin size={size} tip={tip}>
        <div className="p-8" />
      </Spin>
    </div>
  );
}

export default Loading;
