import { useState, useEffect, memo } from 'react';
import { PictureOutlined } from '@ant-design/icons';
import { assetList } from '@/utils/assetUrl';
import OptimizedImage from './OptimizedImage';

/**
 * Render next/image với cơ chế fallback:
 *  - `src` có thể là string hoặc string[]. Nếu là array, ảnh đầu lỗi sẽ tự thử ảnh kế.
 *  - Hết URL khả dụng → render `fallback` (nếu được truyền) hoặc placeholder mặc định
 *    (ô xám, icon ảnh, text "Ảnh chưa được cập nhật").
 *  - Reset lại trạng thái khi `src` thay đổi (vd đổi sản phẩm).
 *
 * Mục đích: dùng thống nhất ở mọi nơi render ảnh do người dùng cung cấp (sản phẩm,
 * banner, carousel, …) để tránh hiển thị icon broken-image của trình duyệt.
 */
function ImageWithFallback({
  src,
  alt = '',
  className,
  style,
  fallback,
  fallbackText = 'Ảnh chưa được cập nhật',
  fallbackClassName,
  loading = 'lazy',
  decoding = 'async',
  width,
  height,
  fill,
  sizes,
  priority,
  onLoad,
  onError,
  ...rest
}) {
  const list = assetList(src);
  const sourceSignature = list.join('|');
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setIdx(0);
    setFailed(false);
    setLoaded(false);
  }, [sourceSignature]);

  if (failed || list.length === 0 || idx >= list.length) {
    if (fallback !== undefined) return fallback;
    return (
      <div 
        className={
          fallbackClassName ||
          (className ? `${className} flex items-center justify-center bg-gray-100 text-gray-400` : 'flex items-center justify-center bg-gray-100 text-gray-400')
        }
        style={style}
        aria-label={alt || 'Ảnh không khả dụng'}
      >
        <div className="flex flex-col items-center gap-1 px-2 text-center">
          <PictureOutlined style={{ fontSize: 28 }} />
          {fallbackText && <span className="text-xs">{fallbackText}</span>}
        </div>
      </div>
    );
  }

  return (
    <OptimizedImage
      src={list[idx]}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={[className, 'amz-lazy-image', loaded ? 'amz-lazy-image--loaded' : '']
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        opacity: style?.opacity ?? 1,
        transition: [style?.transition, 'opacity 180ms ease, filter 220ms ease']
          .filter(Boolean)
          .join(', '),
      }}
      loading={priority ? undefined : loading}
      decoding={decoding}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        onError?.(event);
        setLoaded(false);
        if (idx + 1 < list.length) setIdx(idx + 1);
        else setFailed(true);
      }}
      {...rest}
    />
  );
}

export default memo(ImageWithFallback);
