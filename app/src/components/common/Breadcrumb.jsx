/**
 * Breadcrumb Component - Navigation trail
 * Fixed typo from "Breadcum" to "Breadcrumb"
 */
import React from 'react';
import { Grid } from 'antd';

/**
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items: { label, icon?, active?, onClick? }
 */
function Breadcrumb({ items }) {
  const screens = Grid.useBreakpoint();
  const isSmall = screens.sm === false;

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 mt-4">
      <nav className={`flex items-center ${isSmall ? 'gap-0' : 'gap-2'} ${isSmall ? 'text-xs' : 'text-sm'}`}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <span
              className={`
                flex items-center gap-1 cursor-pointer 
                ${isSmall ? 'px-2 py-1' : 'p-2'}
                ${item.active
                  ? 'bg-orange-500 text-white font-semibold rounded-full border-2 border-orange-500'
                  : 'text-black border-2 rounded-full border-black hover:bg-gray-100'
                }
              `}
              onClick={item.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && item.onClick?.()}
            >
              {item.icon && item.icon}
              {item.label}
            </span>
            {index < items.length - 1 && (
              <span className={`mx-1 text-black ${isSmall ? 'text-xs' : ''}`}>
                {'>'}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}

export default Breadcrumb;
