import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { selectBestSellers } from '../../../store/slices/productsSlice';
import { 
  getBestSellerOrder, 
  updateMultipleProductOrdersOnServer,
  resetBestSellerOrderOnServer,
} from '../../../services/bestSellerOrder.service';
import { formatPrice } from '../../../utils/format.utils';
import { useProductDisplayCategories } from '@/hooks/useProductDisplayCategories';
import OptimizedImage from '@/components/common/OptimizedImage';

function BestSellerSort() {
  const { selectOptions } = useProductDisplayCategories();
  const categoryOptions = useMemo(
    () => [{ label: 'Tất cả phân loại', value: '' }, ...selectOptions],
    [selectOptions]
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || '';
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);

  const bestSellers = useSelector(selectBestSellers);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Đồng bộ state với URL khi URL thay đổi (vd: link từ trang sản phẩm)
  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  // Lọc bestsellers theo phân loại đã chọn
  const bestSellersInCategory = !selectedCategory
    ? bestSellers
    : bestSellers.filter((p) => p.category === selectedCategory);

  // Load và sắp xếp sản phẩm theo thứ tự đã lưu (theo phân loại).
  // Không ghi đè khi user đang kéo thả chưa lưu (hasChanges) để tránh hàng "bật lại" vị trí cũ.
  useEffect(() => {
    if (hasChanges) return;

    const list = !selectedCategory ? bestSellers : bestSellers.filter((p) => p.category === selectedCategory);
    const orderMap = getBestSellerOrder(selectedCategory || null);

    const uniqueProducts = [];
    const seenIds = new Set();

    list.forEach((product) => {
      const productId = product.id || product._id || `${product.brand}-${product.name}-${product.colors?.[0] || ''}`;
      if (productId && !seenIds.has(productId)) {
        seenIds.add(productId);
        uniqueProducts.push({ ...product, _uniqueId: productId });
      } else if (!productId) {
        const fallbackId = `${product.brand || ''}-${product.name || ''}-${Date.now()}-${Math.random()}`;
        uniqueProducts.push({ ...product, _uniqueId: fallbackId });
      }
    });

    const sorted = [...uniqueProducts].sort((a, b) => {
      const idA = a.id || a._uniqueId;
      const idB = b.id || b._uniqueId;
      const orderA = orderMap[idA] ?? Infinity;
      const orderB = orderMap[idB] ?? Infinity;

      if (orderA !== Infinity && orderB !== Infinity) return orderA - orderB;
      if (orderA !== Infinity) return -1;
      if (orderB !== Infinity) return 1;
      return 0;
    });

    setSortedProducts(sorted);
  }, [bestSellers, selectedCategory, hasChanges]);

  // Drag handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    // Set drag image
    const target = e.currentTarget;
    target.style.opacity = '0.5';
    target.style.cursor = 'grabbing';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only remove if we're actually leaving the element (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newProducts = [...sortedProducts];
    const draggedProduct = newProducts[draggedIndex];
    
    // Xóa sản phẩm ở vị trí cũ
    newProducts.splice(draggedIndex, 1);
    
    // Tính toán vị trí mới
    let newIndex = dropIndex;
    if (draggedIndex < dropIndex) {
      newIndex = dropIndex - 1;
    }
    
    // Chèn sản phẩm vào vị trí mới
    newProducts.splice(newIndex, 0, draggedProduct);
    
    setSortedProducts(newProducts);
    setHasChanges(true);
    setDraggedIndex(null);
  };

  const handleDragEnd = (e) => {
    const target = e.currentTarget;
    target.style.opacity = '1';
    target.style.cursor = 'grab';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Lưu thứ tự (theo phân loại đang chọn)
  const handleSave = async () => {
    try {
      await updateMultipleProductOrdersOnServer(
        sortedProducts
          .filter((product) => product.id || product._uniqueId)
          .map((product, index) => ({
            id: product.id || product._uniqueId,
            order: index,
          })),
        selectedCategory || null
      );
      setHasChanges(false);
      alert('Đã lưu thứ tự sắp xếp thành công!');
    } catch (error) {
      console.error('Lỗi lưu thứ tự bán chạy:', error);
      alert(error.message || 'Có lỗi xảy ra khi lưu thứ tự sắp xếp!');
    }
  };

  // Reset thứ tự (chỉ phân loại đang chọn: xóa hết nếu "Tất cả", ngược lại xóa phân loại đó)
  const handleReset = async () => {
    const scope = selectedCategory ? `phân loại "${selectedCategory}"` : 'toàn bộ';
    if (window.confirm(`Bạn chắc chắn muốn reset thứ tự sắp xếp về mặc định cho ${scope}?`)) {
      try {
        await resetBestSellerOrderOnServer(selectedCategory || null);
      } catch (error) {
        console.error('Lỗi reset thứ tự bán chạy:', error);
        alert(error.message || 'Có lỗi xảy ra khi reset thứ tự sắp xếp!');
        return;
      }
      const orderMap = getBestSellerOrder(selectedCategory || null);
      const withId = bestSellersInCategory.map((p) => ({
        ...p,
        _uniqueId: p.id || p._id || `${p.brand}-${p.name}-${p.colors?.[0] || ''}`,
      }));
      const sorted = [...withId].sort((a, b) => {
        const orderA = orderMap[a.id || a._uniqueId] ?? Infinity;
        const orderB = orderMap[b.id || b._uniqueId] ?? Infinity;
        if (orderA !== Infinity && orderB !== Infinity) return orderA - orderB;
        if (orderA !== Infinity) return -1;
        if (orderB !== Infinity) return 1;
        return 0;
      });
      setSortedProducts(sorted);
      setHasChanges(false);
      alert('Đã reset thứ tự sắp xếp!');
    }
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setHasChanges(false);
    if (value) {
      setSearchParams({ category: value });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sắp xếp sản phẩm bán chạy</h1>
            <p className="mt-2 text-sm text-gray-600 max-w-3xl">
              <strong>Nguồn sản phẩm:</strong> cùng hệ thống SQL với cửa hàng. Chỉ hiện các sản phẩm được bật cờ bán chạy.
              <br />
              <strong>Thứ tự kéo thả</strong> được lưu trên server trong collection <code className="text-gray-800 bg-gray-100 px-1 rounded text-xs">bestSellerOrder</code>.
              {' '}Kéo thả để đổi thứ tự hiển thị (theo phân loại hoặc toàn trang).
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>

        {/* Chọn phân loại */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Phân loại:</span>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-w-[220px]"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value || '_all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <span className="text-xs text-gray-500">
              Đang sắp xếp cho: <strong>{selectedCategory}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
        <p>
          Tổng sản phẩm bán chạy: <strong>{bestSellers.length}</strong>
          {selectedCategory && (
            <> | Trong &quot;{selectedCategory}&quot;: <strong>{bestSellersInCategory.length}</strong></>
          )}
          {' '}
          | Đang hiển thị: <strong>{sortedProducts.length}</strong>
        </p>
      </div>

      {/* Info */}
      {sortedProducts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Chưa có sản phẩm nào được đánh dấu là bán chạy. Vui lòng đánh dấu sản phẩm là bán chạy trong trang quản lý sản phẩm.
          </p>
        </div>
      )}

      {/* Product List */}
      {sortedProducts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-700 uppercase">
              <div className="col-span-1">Thứ tự</div>
              <div className="col-span-2">Ảnh</div>
              <div className="col-span-3">Tên sản phẩm</div>
              <div className="col-span-2">Thương hiệu</div>
              <div className="col-span-2">Giá bán</div>
              <div className="col-span-2">Giảm giá</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {sortedProducts.map((product, index) => {
              // priceForSale đã là giá cuối (đã giảm) theo convention admin form,
              // không nhân (1 - salePercent/100) thêm lần nữa để tránh double-discount.
              const finalPrice = Number(product.priceForSale) || 0;

              // Tạo unique key cho mỗi sản phẩm
              const uniqueKey = product._uniqueId || product.id || `${product.brand}-${product.name}-${index}`;
              
              return (
                <div
                  key={uniqueKey}
                  data-product-id={product.id || product._uniqueId}
                  data-index={index}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-all border ${
                    dragOverIndex === index ? 'bg-blue-50 border-blue-300' : 'border-transparent'
                  }`}
                  style={{ 
                    opacity: draggedIndex === index ? 0.5 : 1,
                  }}
                >
                  <div className="col-span-1 flex items-center gap-2">
                    <svg 
                      className="w-5 h-5 text-gray-400 flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                  </div>
                  <div className="col-span-2">
                    {(product.primaryImage || (product.images && product.images.length > 0)) ? (
                      <OptimizedImage
                        src={product.primaryImage || product.images[0]}
                        alt={product.name}
                        width={64}
                        height={64}
                        sizes="64px"
                        draggable={false}
                        className="w-16 h-16 object-cover rounded border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{product.name || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">{product.brand || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(finalPrice)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    {product.salePercent > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        -{product.salePercent}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      {sortedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Hướng dẫn:</strong> Kéo thả các sản phẩm để thay đổi thứ tự hiển thị. Sau khi sắp xếp xong, nhấn &quot;Lưu thay đổi&quot; để áp dụng.
          </p>
        </div>
      )}
    </div>
  );
}

export default BestSellerSort;
