import React, { useEffect, useMemo, useState } from 'react';
import { AppstoreOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { loadCollection, clearDataCache } from '@/lib/data';
import { saveCollectionData } from '@/lib/data.save.js';
import {
  PRODUCT_DISPLAY_CATEGORIES_COLLECTION,
  normalizeProductDisplayCategories,
  DEFAULT_PRODUCT_DISPLAY_CATEGORY_ROWS,
} from '@/lib/productDisplayCategories';
import { COLLECTION_TO_CATEGORY, PRODUCT_COLLECTION_NAMES } from '@/constants';

const collectionSelectOptions = PRODUCT_COLLECTION_NAMES.map((c) => ({
  value: c,
  label: `${COLLECTION_TO_CATEGORY[c] || c} (${c})`,
}));

function ProductDisplayCategories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    label: '',
    collection: '01-nhet-tai-cu',
    sortOrder: 0,
    icon: '📦',
  });

  const sortedRows = useMemo(() => normalizeProductDisplayCategories(rows), [rows]);

  useEffect(() => {
    fetchRows();
  }, []);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const data = await loadCollection(PRODUCT_DISPLAY_CATEGORIES_COLLECTION, true);
      const next = normalizeProductDisplayCategories(data);
      setRows(next.length ? next : DEFAULT_PRODUCT_DISPLAY_CATEGORY_ROWS);
    } catch (e) {
      console.error(e);
      setRows(DEFAULT_PRODUCT_DISPLAY_CATEGORY_ROWS);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      label: '',
      collection: PRODUCT_COLLECTION_NAMES[0] || '01-nhet-tai-cu',
      sortOrder: sortedRows.length,
      icon: '📦',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const label = String(form.label || '').trim();
    if (!label) {
      alert('Vui lòng nhập tên hiển thị');
      return;
    }
    if (!form.collection) {
      alert('Vui lòng chọn collection (kho JSON sản phẩm)');
      return;
    }

    const duplicateLabel = sortedRows.some(
      (r) => r.label === label && (!editing || r.id !== editing.id)
    );
    if (duplicateLabel) {
      alert('Tên hiển thị đã tồn tại. Mỗi tên phải là duy nhất.');
      return;
    }

    const duplicateCollection = sortedRows.some(
      (r) => r.collection === form.collection && (!editing || r.id !== editing.id)
    );
    if (duplicateCollection) {
      alert('Mỗi collection chỉ được gắn một dòng danh mục hiển thị.');
      return;
    }

    const row = {
      id: editing?.id || `pdc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      label,
      collection: form.collection,
      sortOrder: Number(form.sortOrder) || 0,
      icon: String(form.icon || '').trim() || '📦',
      createdAt: editing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let next;
    if (editing) {
      next = sortedRows.map((r) => (r.id === editing.id ? row : r));
    } else {
      next = [...sortedRows, row];
    }

    next = normalizeProductDisplayCategories(next);

    try {
      await saveCollectionData(PRODUCT_DISPLAY_CATEGORIES_COLLECTION, next);
      clearDataCache();
      const fresh = await loadCollection(PRODUCT_DISPLAY_CATEGORIES_COLLECTION, true);
      setRows(
        normalizeProductDisplayCategories(fresh).length
          ? normalizeProductDisplayCategories(fresh)
          : next
      );
      resetForm();
      alert(editing ? 'Đã cập nhật' : 'Đã thêm danh mục');
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu: ' + (err.message || err));
    }
  };

  const handleEdit = (r) => {
    setEditing(r);
    setForm({
      label: r.label,
      collection: r.collection,
      sortOrder: r.sortOrder,
      icon: r.icon || '📦',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa dòng này? Hãy đảm bảo không còn sản phẩm chỉ nhận diện bằng tên cũ trên site.')) return;
    const next = normalizeProductDisplayCategories(sortedRows.filter((r) => r.id !== id));
    if (next.length === 0) {
      alert('Cần ít nhất một danh mục.');
      return;
    }
    try {
      await saveCollectionData(PRODUCT_DISPLAY_CATEGORIES_COLLECTION, next);
      clearDataCache();
      const fresh = await loadCollection(PRODUCT_DISPLAY_CATEGORIES_COLLECTION, true);
      setRows(normalizeProductDisplayCategories(fresh));
      if (editing?.id === id) resetForm();
      alert('Đã xóa');
    } catch (err) {
      alert('Lỗi: ' + (err.message || err));
    }
  };

  return (
    <div className="space-y-6 p-4 max-w-5xl">
      <div className="flex items-center gap-3 mb-2">
        <AppstoreOutlined className="text-2xl text-[#D65312]" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh mục hiển thị sản phẩm</h1>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý nhãn hiển thị trong ô &quot;Danh mục để hiển thị&quot; khi tạo/sửa sản phẩm. Mỗi{' '}
            <strong>collection</strong> (ví dụ <code className="text-xs">01-nhet-tai-cu</code>) chỉ có một
            dòng.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editing ? 'Sửa danh mục' : 'Thêm danh mục'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên hiển thị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                placeholder="Ví dụ: Tai nghe nhét tai cũ"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection (kho dữ liệu) <span className="text-red-500">*</span>
              </label>
              <select
                value={form.collection}
                onChange={(e) => setForm({ ...form, collection: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
              >
                {collectionSelectOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự (số nhỏ lên trước)</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon (emoji, tuỳ chọn)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                placeholder="🎧"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
            >
              <PlusOutlined />
              {editing ? 'Cập nhật' : 'Thêm'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Hủy sửa
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Danh sách ({sortedRows.length}) {loading && '— đang tải...'}
        </h2>
        {!loading && sortedRows.length === 0 ? (
          <p className="text-gray-500">Chưa có dữ liệu.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-2 pr-4">Thứ tự</th>
                  <th className="py-2 pr-4">Icon</th>
                  <th className="py-2 pr-4">Tên hiển thị</th>
                  <th className="py-2 pr-4">Collection</th>
                  <th className="py-2 pr-4 w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-4">{r.sortOrder}</td>
                    <td className="py-2 pr-4 text-lg">{r.icon}</td>
                    <td className="py-2 pr-4 font-medium text-gray-900">{r.label}</td>
                    <td className="py-2 pr-4">
                      <code className="text-xs bg-gray-100 px-1 rounded">{r.collection}</code>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(r)}
                          className="text-[#D65312] hover:underline text-xs"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="text-red-600 hover:underline text-xs inline-flex items-center gap-0.5"
                        >
                          <DeleteOutlined />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDisplayCategories;
