import React, { useState, useEffect } from 'react';
import { MenuOutlined } from '@ant-design/icons';

function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!content) return;

    // Parse HTML content to extract headings
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headingElements = doc.querySelectorAll('h2, h3, h4');
    
    const extractedHeadings = Array.from(headingElements).map((heading, index) => {
      const id = heading.id || `heading-${index}`;
      if (!heading.id) {
        heading.id = id;
      }
      
      return {
        id,
        text: heading.textContent.trim(),
        level: parseInt(heading.tagName.charAt(1)),
      };
    });

    setHeadings(extractedHeadings);

    // Add IDs to actual content headings
    const contentElement = document.querySelector('.post-content');
    if (contentElement) {
      const actualHeadings = contentElement.querySelectorAll('h2, h3, h4');
      actualHeadings.forEach((heading, index) => {
        if (!heading.id && extractedHeadings[index]) {
          heading.id = extractedHeadings[index].id;
        }
      });
    }

    // Intersection Observer for active heading
    const observerOptions = {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, observerOptions);

    headingElements.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headingElements.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [content]);

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveId(id);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <MenuOutlined className="text-[#D65312]" />
        <h3 className="text-lg font-bold text-gray-900">Mục lục</h3>
      </div>
      
      <nav className="space-y-2">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => scrollToHeading(heading.id)}
            className={`block w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
              activeId === heading.id
                ? 'bg-[#D65312] text-white font-semibold'
                : 'text-gray-700 hover:bg-gray-100 hover:text-[#D65312]'
            }`}
            style={{
              paddingLeft: `${(heading.level - 2) * 12 + 12}px`,
            }}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default TableOfContents;


