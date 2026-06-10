import React, { useMemo } from "react";
import { Card } from "antd";
import { useSelector } from "react-redux";
import { selectHomeSettings } from "../../store/slices/settingsSlice";

// Hàm parse iframe embed code để lấy src URL
function parseIframeCode(iframeCode) {
  if (!iframeCode) return null;
  
  // Tìm src trong iframe tag
  const srcMatch = iframeCode.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1];
  }
  
  return null;
}

// Hàm lấy video ID từ URL hoặc embed URL
function getYouTubeId(url) {
  if (!url) return null;
  
  // Nếu là embed URL: youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&#]+)/);
  if (embedMatch) {
    return embedMatch[1];
  }
  
  // Nếu là watch URL: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&#]+)/);
  if (watchMatch) {
    return watchMatch[1];
  }
  
  return null;
}

// Hàm lấy embed URL từ input (có thể là URL hoặc iframe code)
function getEmbedUrl(input) {
  if (!input) return null;
  
  // Nếu là iframe code, parse để lấy src
  if (input.includes('<iframe')) {
    const src = parseIframeCode(input);
    if (src) {
      // Nếu src đã là embed URL, trả về luôn
      if (src.includes('youtube.com/embed/')) {
        return src;
      }
      // Nếu là watch URL, convert sang embed URL
      const videoId = getYouTubeId(src);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    return null;
  }
  
  // Nếu là URL trực tiếp
  if (input.includes('youtube.com/embed/')) {
    return input;
  }
  
  // Nếu là watch URL, convert sang embed URL
  const videoId = getYouTubeId(input);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return null;
}

function VideoBanner() {
  const home = useSelector(selectHomeSettings);
  const youtubeBannerInput = useMemo(() => home?.[0]?.youtubeBanner || '', [home]);

  // Parse input để lấy embed URL
  const embedUrl = useMemo(() => {
    if (!youtubeBannerInput) {
      return null;
    }

    // Lấy embed URL từ input (có thể là URL hoặc iframe code)
    const baseEmbedUrl = getEmbedUrl(youtubeBannerInput);
    if (!baseEmbedUrl) {
      return null;
    }

    // Nếu input là iframe code, lấy src trực tiếp từ iframe
    if (youtubeBannerInput.includes('<iframe')) {
      const src = parseIframeCode(youtubeBannerInput);
      if (src) {
        return src;
      }
    }
    
    return baseEmbedUrl;
  }, [youtubeBannerInput]);

  if (!embedUrl) {
    return null;
  }

  return (
    <div className="w-full mt-2 md:mt-0">
      <Card
        variant="borderless"
        className="rounded-lg overflow-hidden shadow-md"
        styles={{ body: { padding: 0 } }}
      >
        <iframe
          src={embedUrl}
          className="
            w-full object-cover
            h-[180px]
            md:h-[400px]
            lg:h-[560px]
            rounded-lg
          "
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="YouTube video player"
        />
      </Card>
    </div>
  );
}

export default VideoBanner;
