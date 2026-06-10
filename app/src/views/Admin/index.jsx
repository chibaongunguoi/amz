import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { message, Modal } from "antd";
import {
  getAllTaiNgheNhetTai, 
  getAllNewSealTaiNghe, 
  getAllLoaKaraoke, 
  getAllLoaDeBan,
  getAllTaiNgheChupTai, 
  getAllLoaDiDong 
} from "@/utils/product.firestore.js";
import ProductForm from './Product/ProductForm.jsx';
import { formatPrice } from '@/utils/format.utils.js'
import {
  downloadProductSkuImportTemplate,
  parseSkuImportWorkbook,
} from '@/utils/productImport.excel.js';
import {
  downloadProductNameImportTemplate,
  parseNameImportWorkbook,
} from '@/utils/productImportUpsert.excel.js';
import { useProductDisplayCategories } from '@/hooks/useProductDisplayCategories';
import OptimizedImage from '@/components/common/OptimizedImage';

function formatConditionCell(row) {
  if (row.variants?.length > 0) {
    const uniq = [...new Set(row.variants.map((v) => (v.condition != null ? String(v.condition).trim() : '')).filter(Boolean))];
    if (uniq.length === 1) return uniq[0];
    if (uniq.length > 1) return `${uniq.length} tình trạng`;
    /* Không có TT trên biến thể → TT cha */
  }
  const cond = row.condition;
  if (Array.isArray(cond)) {
    const parts = cond.map((x) => String(x ?? '').trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  }
  const s = String(cond ?? '').trim();
  return s || '—';
}

/**
 * Mã sản phẩm (cột ma_san_pham khi import Excel). ID nội bộ `row.key` chỉ để hệ thống — không thay mã SP.
 */
function formatProductMaSanPham(row) {
  const m = row.maSanPham != null ? String(row.maSanPham).trim() : '';
  return m || '—';
}

function productMaSanPhamCellTitle(row) {
  const parts = [];
  const m = row.maSanPham != null ? String(row.maSanPham).trim() : '';
  if (m) parts.push(`Mã SP: ${m}`);
  if (row.key != null && String(row.key) !== '') {
    parts.push(`ID nội bộ: ${row.key}`);
  }
  return parts.length ? parts.join('\n') : undefined;
}

const PRODUCT_LIST_TABLE_CLASS = 'w-full border-collapse table-fixed min-w-[68rem]';

function ProductListColgroup() {
  return (
    <colgroup>
      <col style={{ width: '3rem' }} />
      <col style={{ width: '5rem' }} />
      <col />
      <col style={{ width: '7rem' }} />
      <col style={{ width: '6rem' }} />
      {/* <col style={{ width: '6.5rem' }} />
      <col style={{ width: '6.5rem' }} /> */}
      <col style={{ width: '4rem' }} /> 
      <col style={{ width: '5rem' }} />
      <col style={{ width: '7rem' }} />
      <col style={{ width: '8rem' }} />
    </colgroup>
  );
}

function Admin() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState("01-nhet-tai-cu");
  const [editModal, setEditModal] = useState({ visible: false, key: '', value: '', page: '', code: '' });
  const [searchText, setSearchText] = useState(""); 
  const [addModal, setAddModal] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState(null);
  const [shouldCloseAfterSave, setShouldCloseAfterSave] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const formSubmitRef = useRef(null);
  const skuImportInputRef = useRef(null);
  const nameImportInputRef = useRef(null);
  const [isUpserting, setIsUpserting] = useState(false);
  const [bestSellerSavingKeys, setBestSellerSavingKeys] = useState(() => new Set());
  const headerRef = useRef(null);
  const tableHeaderRef = useRef(null);
  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  /** { src, alt } — xem ảnh phóng to trong bảng */
  const [imagePreview, setImagePreview] = useState(null);
  const [isFilter, setIsFilter] = useState(false); 
  
  const { rows: displayCategoryRows } = useProductDisplayCategories();
  const categoryOptions = useMemo(
    () =>
      displayCategoryRows.map((r) => ({
        label: r.label,
        value: r.collection,
        icon: r.icon || '📦',
      })),
    [displayCategoryRows]
  );

  const openImagePreview = useCallback((src, alt = '') => {
    if (!src || typeof src !== 'string') return;
    setImagePreview({ src, alt: alt || 'Ảnh sản phẩm' });
  }, []);

  const closeImagePreview = useCallback(() => setImagePreview(null), []);

  useEffect(() => {
    if (!imagePreview) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [imagePreview]);

  // Fetch data
  useEffect(() => {
    setIsLoading(true);
    let unsubscribe;
    const fetchFunctions = {
      "06-hang-newseal": getAllNewSealTaiNghe,
      "01-nhet-tai-cu": getAllTaiNgheNhetTai,
      "02-chup-tai-cu": getAllTaiNgheChupTai,
      "03-di-dong-cu": getAllLoaDiDong,
      "04-de-ban-cu": getAllLoaDeBan,
      "05-loa-karaoke": getAllLoaKaraoke,
    };

    const fetchFn = fetchFunctions[category] || getAllTaiNgheNhetTai;
    unsubscribe = fetchFn((data) => {
      setItems(data);
      setIsLoading(false);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [category]); 

  const parseProductRecord = useCallback((value, fallbackCode = category, fallbackPage = `page${page + 1}`) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const code = value.collection || fallbackCode;
      return {
        ...value,
        _code: code,
        _page: fallbackPage,
      };
    }

    return {
      _code: fallbackCode,
      _page: fallbackPage,
      images: [],
      variants: [],
    };
  }, [category, page]);

  const buildTableData = useCallback(() => {
    const pageItems = items[page] || {};
    const rows = Object.entries(pageItems)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => {
        const obj = parseProductRecord(value, category, `page${page + 1}`);
        const rawVariants = Array.isArray(obj.variants) ? obj.variants : [];
        const mainThumb =
          Array.isArray(obj.images) && obj.images.length > 0 ? obj.images[0] : null;
        const variants = rawVariants.map((v) => {
          const fromVar = Array.isArray(v.images) && v.images[0] ? v.images[0] : null;
          const skuStored =
            v.sku != null && String(v.sku).trim() !== '' ? String(v.sku).trim() : '';
          return {
            id: v.id || '',
            sku: skuStored,
            name: v.name || '',
            color: v.color || '',
            condition: v.condition || '',
            priceForSale: Number(v.priceForSale) || 0,
            priceDefault: Number(v.priceDefault) || 0,
            salePercent: Number(v.salePercent) || 0,
            thumb: fromVar || mainThumb || null,
          };
        });
        const catMeta = categoryOptions.find(
          (o) => o.value === obj._code || o.label === (obj.category || '')
        );
        return {
          key,
          brand: obj.brand || '',
          name: obj.name || '',
          maSanPham: obj.maSanPham || '',
          loaiSp: obj.loaiSp || '',
          category: obj.category || '',
          categoryLabel: catMeta?.label || '',
          variants,
          colors: obj.colors || '',
          priceForSale: obj.priceForSale || '',
          priceDefault: obj.priceDefault || '',
          salePercent: obj.salePercent || '',
          isbestSeller:
            obj.isbestSeller === true ||
            obj.isBestSeller === '1' ||
            obj.isBestSeller === true,
          isHide: obj.isHide === true || obj.isHide === 'true',
          condition: obj.condition || '',
          images: Array.isArray(obj.images) ? obj.images : (obj.images ? String(obj.images).split(';;').filter(Boolean) : []),
          description: obj.description || '',
          _code: obj._code,
          _page: obj._page,
          _raw: value,
          _product: obj,
        };
      });
      console.log('Raw rows:', rows);
    const qRaw = (searchText || '').trim();
    if (qRaw !== '') {
      const q = qRaw.toLowerCase();
      const asSearchChunk = (x) => {
        if (x == null || x === '') return '';
        if (Array.isArray(x)) {
          return x.map((y) => String(y ?? '').trim()).filter(Boolean).join(' ');
        }
        return String(x).trim();
      };
      return rows.filter((r) => {
        const variantBlob = (r.variants || [])
          .map((v) =>
            [
              asSearchChunk(v.sku),
              asSearchChunk(v.id),
              asSearchChunk(v.name),
              asSearchChunk(v.color),
              asSearchChunk(v.condition),
            ]
              .filter(Boolean)
              .join(' ')
          )
          .join(' ');
        const target = [
          asSearchChunk(r.key),
          asSearchChunk(r.maSanPham),
          asSearchChunk(r.brand),
          asSearchChunk(r.name),
          asSearchChunk(r.colors),
          asSearchChunk(r.description),
          asSearchChunk(r.condition),
          asSearchChunk(r.category),
          asSearchChunk(r.categoryLabel),
          variantBlob,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return target.includes(q);
      });
    }

    return rows;
  }, [items, page, searchText, categoryOptions, category, parseProductRecord]);

  const tableData = useMemo(() => buildTableData(), [buildTableData]);
  const selectedCount = selectedRowKeys.length;
  const hasSelection = selectedCount > 0;
  const currentCategory = categoryOptions.find(opt => opt.value === category);

  async function handleUpdateProduct(updated, key, code, _page) {
    try {
      message.loading({ content: 'Đang lưu...', key: 'updateProduct', duration: 0 });
      
      const { updateProductInCollection } = await import('@/lib/data.save.js');

      await updateProductInCollection(code, key, {
        ...updated,
        id: key,
        collection: code,
      }, page);

      const { clearDataCache } = await import('@/lib/data.js');
      clearDataCache();
      setHasUnsavedChanges(false);
      reloadCurrentCategory();
      message.success({ content: 'Cập nhật thành công!', key: 'updateProduct' });
      
    } catch (error) {
      console.error('❌ Lỗi khi lưu dữ liệu:', error);
      const errorMessage = error.message || 'Lỗi khi lưu dữ liệu. Vui lòng thử lại.';
      message.error({ content: errorMessage, key: 'updateProduct', duration: 5 });
      setIsLoading(false);
    }
  }

  async function handleToggleBestSeller(row, nextValue) {
    if (!row?.key || bestSellerSavingKeys.has(row.key)) return;
    setBestSellerSavingKeys((prev) => new Set(prev).add(row.key));
    try {
      const current = row._product || parseProductRecord(row._raw, row._code, row._page);
      await handleUpdateProduct(
        {
          ...current,
          isbestSeller: nextValue,
          isBestSeller: nextValue ? '1' : '0',
        },
        row.key,
        row._code,
        row._page
      );
    } finally {
      setBestSellerSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(row.key);
        return next;
      });
    }
  }

async function handleHideSelected() {
  if (selectedCount === 0) return;

  try {
    
    for (const k of selectedRowKeys) {
      const rec = tableData.find(r => r.key === k);
      if (!rec) continue;
      const current = rec._product || parseProductRecord(rec._raw, rec._code, rec._page);
      console.log(current);
      console.log(current.variants);
      await handleUpdateProduct(
        { ...current,
          isHide: !isFilter, 
        },
        rec.key,
        rec._code,
        rec._page
      );
    }

    setSelectedRowKeys([]);
    
    // Fetch lại dữ liệu để kiểm tra
    await reloadCurrentCategory();
    
    // // Log để debug
    // console.log('Updated products (hidden):', updatedProducts);
    // console.log('Current table data after reload:', tableData);

    message.success({
      content: `Đã ẩn ${selectedCount} sản phẩm`,
      key: 'hideProduct',
    });

  } catch (error) {
    console.error(error);
    message.error({
      content: error.message || 'Ẩn sản phẩm thất bại',
      key: 'hideProduct',
      duration: 5,
    });
  }
}

  const handleDeleteProduct = useCallback(async (key, code, page) => {
    try {
      message.loading({ content: 'Đang xóa...', key: 'deleteProduct', duration: 0 });
      
      // Xóa sản phẩm qua API server
      const { deleteProductFromCollection } = await import('@/lib/data.save.js');
      await deleteProductFromCollection(code, key, page);
      
      // Clear cache và reload lại data từ server sau khi xóa thành công
      const { clearDataCache } = await import('@/lib/data.js');
      clearDataCache();
      
      // Reload lại data từ server
      setIsLoading(true);
      const fetchFunctions = {
        "06-hang-newseal": getAllNewSealTaiNghe,
        "01-nhet-tai-cu": getAllTaiNgheNhetTai,
        "02-chup-tai-cu": getAllTaiNgheChupTai,
        "03-di-dong-cu": getAllLoaDiDong,
        "04-de-ban-cu": getAllLoaDeBan,
        "05-loa-karaoke": getAllLoaKaraoke,
      };
      
      const fetchFn = fetchFunctions[category] || getAllTaiNgheNhetTai;
      fetchFn((data) => {
        setItems(data);
        setIsLoading(false);
        message.success({ content: 'Đã xóa sản phẩm', key: 'deleteProduct' });
      });
      
    } catch (error) {
      console.error('❌ Lỗi khi xóa sản phẩm:', error);
      const errorMessage = error.message || 'Lỗi khi xóa sản phẩm. Vui lòng thử lại.';
      message.error({ content: errorMessage, key: 'deleteProduct', duration: 5 });
      setIsLoading(false);
    }
  }, [category]);
  const handleHide = useCallback( () => {
    setIsFilter(true);
    }
 ,[]);
 const handleShowAll = useCallback( () => {
    setIsFilter(false);
    }
 ,[]);
  const handleDeleteSelected = useCallback(() => {
    if (selectedCount === 0) return;
    
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa ${selectedCount} sản phẩm đã chọn?`
    );
    
    if (confirmed) {
      selectedRowKeys.forEach(k => {
        const rec = tableData.find(r => r.key === k);
        if (rec) handleDeleteProduct(rec.key, rec._code, rec._page);
      });
      setSelectedRowKeys([]);
      message.success(`Đã xóa ${selectedCount} sản phẩm`, 2);
    }
  }, [handleDeleteProduct, selectedRowKeys, selectedCount, tableData]);

  const handleEditSelected = useCallback(() => {
    if (selectedCount === 0) return;
    
    const firstKey = selectedRowKeys[0];
    const rec = tableData.find(r => r.key === firstKey);
    if (rec) {
      const obj = rec._product || parseProductRecord(rec._raw, rec._code, rec._page);
      setEditModal({ visible: true, key: rec.key, value: obj, page: rec._page, code: rec._code });
    }
  }, [selectedRowKeys, selectedCount, tableData, parseProductRecord]);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedRowKeys(tableData.map(r => r.key));
    } else {
      setSelectedRowKeys([]);
    }
  }, [tableData]);

  const handleSelectRow = useCallback((key, checked) => {
    if (checked) {
      setSelectedRowKeys(prev => [...prev, key]);
    } else {
      setSelectedRowKeys(prev => prev.filter(k => k !== key));
    }
  }, []);
  const closeEditModal = useCallback((forceClose = false) => {
    if (forceClose || !hasUnsavedChanges) {
      setEditModal({ visible: false, key: '', value: '', page: '', code: '' });
      setHasUnsavedChanges(false);
      setPendingCloseAction(null);
    } else {
      setPendingCloseAction(() => () => {
        setEditModal({ visible: false, key: '', value: '', page: '', code: '' });
        setHasUnsavedChanges(false);
        setPendingCloseAction(null);
      });
    }
  }, [hasUnsavedChanges]);

  const handleSaveAndClose = useCallback(() => {
    setShouldCloseAfterSave(true);
    setPendingCloseAction(null);
    if (formSubmitRef.current?.submit) {
      formSubmitRef.current.submit();
    }
  }, []);

  const handleDontSaveAndClose = useCallback(() => {
    setEditModal({ visible: false, key: '', value: '', page: '', code: '' });
    setHasUnsavedChanges(false);
    setPendingCloseAction(null);
  }, []);

  const reloadCurrentCategory = useCallback(() => {
    setIsLoading(true);
    const fetchFunctions = {
      "06-hang-newseal": getAllNewSealTaiNghe,
      "01-nhet-tai-cu": getAllTaiNgheNhetTai,
      "02-chup-tai-cu": getAllTaiNgheChupTai,
      "03-di-dong-cu": getAllLoaDiDong,
      "04-de-ban-cu": getAllLoaDeBan,
      "05-loa-karaoke": getAllLoaKaraoke,
    };
    const fetchFn = fetchFunctions[category] || getAllTaiNgheNhetTai;
    fetchFn((data) => {
      setItems(data);
      setIsLoading(false);
    });
  }, [category]);

  const handleDownloadSkuTemplate = useCallback(() => {
    try {
      downloadProductSkuImportTemplate();
      message.success({ content: 'Đã tải mau-import-theo-sku.xlsx', duration: 3 });
    } catch (e) {
      console.error(e);
      message.error({ content: 'Không tạo được file mẫu.', duration: 4 });
    }
  }, []);

  const handleSkuImportFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const parsed = parseSkuImportWorkbook(buf);
      if (!parsed.ok) {
        Modal.error({
          title: 'Không thể import theo SKU (sheet BienThe)',
          width: 600,
          content: (
            <div className="max-h-72 overflow-y-auto text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {parsed.errors.length ? parsed.errors.join('\n') : 'File không hợp lệ.'}
            </div>
          ),
        });
        return;
      }

      message.loading({
        content: `Đang import theo SKU (${parsed.variantRowCount ?? parsed.records.length} dòng BienThe)...`,
        key: 'skuExcelImport',
        duration: 0,
      });
      const { batchMergeVariantsBySkuImport, appendProductConditionPresets } = await import('@/lib/data.save.js');
      const { added, updated, skipped, skippedDetails, collectionsTouched } =
        await batchMergeVariantsBySkuImport(parsed.records);

      if (parsed.conditionLabels?.length) {
        try {
          await appendProductConditionPresets(parsed.conditionLabels);
        } catch (presetErr) {
          console.warn('Condition presets:', presetErr);
        }
      }

      const { clearDataCache } = await import('@/lib/data.js');
      clearDataCache();
      reloadCurrentCategory();

      if (parsed.warnings?.length) {
        message.warning({ content: parsed.warnings.join(' '), key: 'skuExcelImportWarn', duration: 8 });
      }

      const parts = [];
      if (updated > 0) parts.push(`Cập nhật/thêm biến thể: ${updated}`);
      if (skipped > 0) parts.push(`Bỏ qua (chưa có SP/SKU trong kho): ${skipped}`);
      if (added > 0) parts.push(`Thêm SP mới: ${added}`);
      const colNote = collectionsTouched.length ? ` [${collectionsTouched.join(', ')}]` : '';
      message.success({
        content: `[Theo SKU] ${parts.join(' • ') || 'Hoàn tất.'}${colNote}. SP mới: dùng Import theo tên.`,
        key: 'skuExcelImport',
        duration: 6,
      });

      if (skipped > 0 && skippedDetails?.length) {
        Modal.warning({
          title: 'Một số dòng BienThe không khớp kho',
          width: 560,
          content: (
            <div className="max-h-64 overflow-y-auto text-sm text-gray-800 font-mono whitespace-pre-wrap">
              {skippedDetails
                .slice(0, 40)
                .map((d) => `Mã SP ${d.maSanPham} | SKU ${d.sku}: ${d.reason}`)
                .join('\n')}
              {skippedDetails.length > 40 ? `\n… và ${skippedDetails.length - 40} dòng khác.` : ''}
            </div>
          ),
        });
      }
    } catch (err) {
      console.error(err);
      message.error({
        content: err?.message || 'Import thất bại. Kiểm tra API server (npm run server).',
        key: 'skuExcelImport',
        duration: 6,
      });
    }
  }, [reloadCurrentCategory]);

  const handleDownloadNameTemplate = useCallback(() => {
    try {
      downloadProductNameImportTemplate();
      message.success({ content: 'Đã tải mau-import-theo-ten-san-pham.xlsx', duration: 3 });
    } catch (e) {
      console.error(e);
      message.error({ content: 'Không tạo được file mẫu.', duration: 4 });
    }
  }, []);

  const handleNameImportFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUpserting(true);
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseNameImportWorkbook(buf);
      if (!parsed.ok) {
        Modal.error({
          title: 'Không thể import theo tên sản phẩm',
          width: 640,
          content: (
            <div className="max-h-72 overflow-y-auto text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {parsed.errors.length ? parsed.errors.join('\n') : 'File không hợp lệ.'}
            </div>
          ),
        });
        return;
      }

      message.loading({
        content: `Đang import theo tên (${parsed.intents.length} dòng, insert/update)...`,
        key: 'nameExcelImport',
        duration: 0,
      });

      const { batchUpsertProductIntents, appendProductConditionPresets } = await import(
        '@/lib/data.save.js'
      );
      const { inserted, updated, skipped, collectionsTouched, details } =
        await batchUpsertProductIntents(parsed.intents);

      if (parsed.conditionLabels?.length) {
        try {
          await appendProductConditionPresets(parsed.conditionLabels);
        } catch (presetErr) {
          console.warn('Condition presets:', presetErr);
        }
      }

      const { clearDataCache } = await import('@/lib/data.js');
      clearDataCache();
      reloadCurrentCategory();
      setAddModal(false);

      const skippedDetails = details.filter((d) => d.status === 'skipped');
      const summaryLine = `Đã thêm mới: ${inserted} • Cập nhật: ${updated} • Bỏ qua: ${skipped}`;
      const colsLine = collectionsTouched.length
        ? `\nDanh mục bị tác động: ${collectionsTouched.join(', ')}`
        : '';
      message.success({
        content: `[Theo tên SP] ${summaryLine}${colsLine}`,
        key: 'nameExcelImport',
        duration: 6,
      });

      if (parsed.warnings?.length) {
        Modal.warning({
          title: 'Import hoàn tất — có cảnh báo',
          width: 640,
          content: (
            <div className="max-h-72 overflow-y-auto text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {parsed.warnings.join('\n')}
            </div>
          ),
        });
      }

      if (skippedDetails.length > 0) {
        Modal.info({
          title: `Có ${skippedDetails.length} dòng bị bỏ qua`,
          width: 640,
          content: (
            <div className="max-h-72 overflow-y-auto text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {skippedDetails
                .map((d) => `Dòng ${d.line}: ${d.reason || 'Không rõ lý do'}`)
                .join('\n')}
            </div>
          ),
        });
      }
    } catch (err) {
      console.error(err);
      message.error({
        content: err?.message || 'Import thất bại. Kiểm tra API server (npm run server).',
        key: 'nameExcelImport',
        duration: 6,
      });
    } finally {
      setIsUpserting(false);
    }
  }, [reloadCurrentCategory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        if (imagePreview) {
          closeImagePreview();
          return;
        }
        if (editModal.visible) closeEditModal();
        if (addModal) setAddModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editModal.visible, addModal, closeEditModal, imagePreview, closeImagePreview]);

  // Modal body scroll lock
  useEffect(() => {
    if (editModal.visible || addModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [editModal.visible, addModal]);

  // Reset unsaved changes when modal opens
  useEffect(() => {
    if (editModal.visible) {
      setHasUnsavedChanges(false);
      setPendingCloseAction(null);
    }
  }, [editModal.visible]);

  // Calculate header heights for sticky positioning
  useEffect(() => {
    const updateHeights = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    
    updateHeights();
    const resizeObserver = headerRef.current && window.ResizeObserver
      ? new ResizeObserver(updateHeights)
      : null;
    
    if (resizeObserver && headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }
    
    window.addEventListener('resize', updateHeights);
    
    return () => {
      window.removeEventListener('resize', updateHeights);
      resizeObserver?.disconnect();
    };
  }, [category, searchText, selectedCount]);

  // Đồng bộ scroll ngang giữa header và body (hai bảng tách)
  // Thêm hàm debug này vào component


  useEffect(() => {
    const headerEl = headerScrollRef.current;
    const bodyEl = bodyScrollRef.current;
    if (!headerEl || !bodyEl) return;

    let syncing = false;
    const syncScroll = (source, target) => {
      if (syncing) return;
      syncing = true;
      target.scrollLeft = source.scrollLeft;
      syncing = false;
    };
    const onHeaderScroll = () => syncScroll(headerEl, bodyEl);
    const onBodyScroll = () => syncScroll(bodyEl, headerEl);
    headerEl.addEventListener('scroll', onHeaderScroll, { passive: true });
    bodyEl.addEventListener('scroll', onBodyScroll, { passive: true });
    return () => {
      headerEl.removeEventListener('scroll', onHeaderScroll);
      bodyEl.removeEventListener('scroll', onBodyScroll);
    };
  }, [isLoading, items.length, tableData.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header 
        ref={headerRef}
        className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/95"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-4 space-y-3">
            {/* Top Row: Title and Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentCategory?.icon || '📦'}</span>
                  <h1 className="text-xl font-bold text-gray-900">Quản lý sản phẩm</h1>
                </div>
                {hasSelection && (
                  <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Đã chọn: {selectedCount}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-end">
                {/* Hai loại import: SKU vs tên SP */}
                <div
                  className="flex flex-wrap items-stretch gap-2 rounded-xl border border-gray-200 bg-white px-2 py-2 shadow-sm"
                  role="group"
                  aria-label="Import Excel"
                >
                  <div className="flex flex-col gap-1 border-r border-gray-100 pr-3 min-w-[7.5rem]">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 px-0.5">
                      Theo SKU
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={handleDownloadSkuTemplate}
                        className="inline-flex items-center gap-1 px-2 py-1.5 bg-gray-50 border border-gray-200 text-gray-800 text-xs font-medium rounded-md hover:bg-gray-100"
                        title="Tải mẫu mau-import-theo-sku.xlsx"
                      >
                        Mẫu
                      </button>
                      <button
                        type="button"
                        onClick={() => skuImportInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800"
                        title="Import sheet BienThe — khớp/cập nhật theo Mã SKU"
                      >
                        Import
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 pl-1 min-w-[7.5rem]">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 px-0.5">
                      Theo tên SP
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={handleDownloadNameTemplate}
                        disabled={isUpserting}
                        className="inline-flex items-center gap-1 px-2 py-1.5 bg-gray-50 border border-gray-200 text-gray-800 text-xs font-medium rounded-md hover:bg-gray-100 disabled:opacity-50"
                        title="Tải mẫu mau-import-theo-ten-san-pham.xlsx"
                      >
                        Mẫu
                      </button>
                      <button
                        type="button"
                        onClick={() => nameImportInputRef.current?.click()}
                        disabled={isUpserting}
                        className="inline-flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-300 text-gray-900 text-xs font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
                        title="Mã SP trước, tên SP sau, hoặc id Redux"
                      >
                        Import
                      </button>
                    </div>
                  </div>
                </div>
                <input
                  ref={skuImportInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  aria-hidden
                  onChange={handleSkuImportFileChange}
                />
                <input
                  ref={nameImportInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  aria-hidden
                  onChange={handleNameImportFileChange}
                />
                <button
                  type="button"
                  onClick={() => setAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm font-medium rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                  aria-label="Thêm sản phẩm mới"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Thêm sản phẩm</span>
                  <span className="sm:hidden">Thêm</span>
                </button>
              </div>
            </div>

            {/* Second Row: Actions Left, Search Right */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Left: Category and Bulk Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-col gap-1">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    aria-label="Chọn danh mục sản phẩm"
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {hasSelection && (
                  <>
                    <button
                      type="button"
                      onClick={handleEditSelected}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all shadow-sm active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="hidden sm:inline">Sửa ({selectedCount})</span>
                      <span className="sm:hidden">Sửa</span>
                    </button>

                     <button
                      type="button"
                      onClick={handleHideSelected}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all shadow-sm active:scale-95"
                    >
                      <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.02-2.33 2.88-4.27 5.1-5.57"/>
                        <path d="M1 1l22 22"/>
                        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7a11.76 11.76 0 0 1-4.24 5.5"/>
                        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"/>
                      </svg>
                      <span className="hidden sm:inline">Ẩn ({selectedCount})</span>
                      <span className="sm:hidden">Ẩn</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all shadow-sm active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="hidden sm:inline">Xóa ({selectedCount})</span>
                      <span className="sm:hidden">Xóa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRowKeys([])}
                      className="px-2 py-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                      aria-label="Bỏ chọn tất cả"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Right: Compact Search */}
              <div className="relative sm:w-auto sm:min-w-[280px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm theo tên, mã SP, mã SKU biến thể, thương hiệu, mô tả…"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Table Header - Inside Sticky Container */}
            {!isLoading && items.length > 0 && tableData.length > 0 && (
              <div className="border-t-2 border-gray-200 mt-4">
                <div
                  ref={headerScrollRef}
                  className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
                >
                  <table className={PRODUCT_LIST_TABLE_CLASS}>
                    <ProductListColgroup />
                    <thead ref={tableHeaderRef} className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2.5 w-12 text-left">
                          <input
                            type="checkbox"
                            checked={selectedRowKeys.length === tableData.length && tableData.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900"
                            aria-label="Chọn tất cả"
                          />
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider w-20">Ảnh</th>
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Sản phẩm</th>
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Mã SP</th>
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Thương hiệu</th>
                        {/* <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">Giá bán</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">Giá gốc</th> */}
                        <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Giảm</th>
                        <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Bán chạy</th>
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Tình trạng</th>
                        <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-900 uppercase tracking-wider sticky right-0 bg-gray-50 w-32 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.1)]">Thao tác</th>
                      </tr>
                      <tr className="border-t border-gray-200 bg-gray-100/50">
            <td className="px-3 py-2 w-12"></td> {/* Cột checkbox để trống */}
            <td className="px-3 py-2 w-20"></td> {/* Cột ảnh để trống */}
            
            {/* Cột Sản phẩm - hiển thị 2 nút */}
            <td className="px-3 py-2" colSpan={1}>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleShowAll}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white border ${!isFilter ? 'border-red-500 border-2' : 'border-gray-300'} text-gray-700 hover:bg-gray-50  transition-colors`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>Sản phẩm không bị ẩn</span>
                  <span className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded-full text-[11px] font-semibold">
                    {tableData.length-tableData.filter(item => item.isHide === true).length}
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={handleHide}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white border ${isFilter ? 'border-red-500 border-2' : 'border-gray-300'} text-gray-700 hover:bg-gray-50  transition-colors`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  <span>Bị ẩn</span>
                  <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[11px] font-semibold">
                    {tableData.filter(item => item.isHide === true).length}
                  </span>
                </button>
              </div>
            </td>
            
            {/* Các cột còn lại để trống hoặc gộp */}
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2 text-center"></td>
            <td className="px-3 py-2 text-center"></td>
            <td className="px-3 py-2"></td>
            <td className="px-3 py-2 sticky right-0 bg-gray-100/50 w-32"></td>
          </tr>
                    </thead>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Navigation - Sticky dưới header khi scroll */}
        {items.length > 0 && (
          <div
            className="sticky z-40 mb-6 py-3 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 shadow-sm"
            style={{ top: headerHeight || 0 }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Trang:</span>
              {items.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPage(idx)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    page === idx
                      ? 'bg-gray-900 text-white shadow-md scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
                  }`}
                  aria-label={`Trang ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mb-4"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && items.length > 0 && tableData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div ref={bodyScrollRef} className="overflow-x-auto">
              <table className={PRODUCT_LIST_TABLE_CLASS}>
                <ProductListColgroup />
                <tbody className="bg-white divide-y divide-gray-100">
                  {tableData.map((row) => {
                    const rowCat =
                      categoryOptions.find((o) => o.value === row._code || o.label === row.category) ||
                      currentCategory;
                     if (row.isHide!=isFilter) return null;
                    return (
                    <tr 
                      key={row.key} 
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-3 py-3 align-top w-12 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRowKeys.includes(row.key)}
                          onChange={(e) => handleSelectRow(row.key, e.target.checked)}
                          className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900"
                          aria-label={`Chọn ${row.name}`}
                        />
                      </td>
                      <td className="px-3 py-3 align-top w-20">
                        {row.images && row.images.length > 0 ? (
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              className="p-0 rounded-md border-0 bg-transparent cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                              title="Xem phóng to"
                              aria-label={`Xem ảnh phóng to: ${row.name || 'Sản phẩm'}`}
                              onClick={() =>
                                openImagePreview(row.images[0], row.name || 'Sản phẩm')
                              }
                            >
                              <OptimizedImage
                                src={row.images[0]} 
                                alt={row.name || 'Sản phẩm'} 
                                width={48}
                                height={48}
                                sizes="48px"
                                className="w-12 h-12 object-cover rounded-md border border-gray-200 shadow-sm pointer-events-none" 
                              />
                            </button>
                            {/* {console.log(row)} */}
                            {row.images.length > 1 && (
                              <div className="ml-1 w-6 h-6 flex items-center justify-center text-[10px] font-semibold text-gray-600 bg-gray-100 rounded border border-gray-200">
                                +{row.images.length - 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="font-medium text-gray-900 text-sm" title={row.name}>
                          {row.name || <span className="text-gray-400 italic">Chưa có tên</span>}
                        </div>
                        {rowCat ? (
                          <div className="mt-0.5 text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="inline-flex items-center gap-1.5">
                              <span aria-hidden>{rowCat.icon}</span>
                              <span>{rowCat.label}</span>
                            </span>
                          </div>
                        ) : null}
                        {row.variants?.length > 0 && (
                          <details className="group mt-2 rounded-lg border border-gray-200 bg-gray-50/90 text-left [&_summary::-webkit-details-marker]:hidden">
                            <summary className="cursor-pointer select-none px-2.5 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100/90 rounded-lg flex items-center gap-2 list-none">
                              <svg
                                className="w-3.5 h-3.5 shrink-0 text-gray-600 transition-transform duration-200 group-open:rotate-90"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span>
                                Biến thể ({row.variants.length}) — bấm để xem
                              </span>
                            </summary>
                            <div className="px-2 pb-2.5 pt-1 border-t border-gray-200 space-y-2 max-h-72 overflow-y-auto">
                              {row.variants.map((v, vi) => (
                                <div
                                  key={`${row.key}-var-${vi}`}
                                  className="flex gap-2 items-start rounded-md bg-white border border-gray-100 p-2 shadow-sm"
                                >
                                  <div className="shrink-0 w-10 h-10 rounded border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                                    {v.thumb ? (
                                      <button
                                        type="button"
                                        className="p-0 w-full h-full border-0 bg-transparent cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900"
                                        title="Xem phóng to"
                                        aria-label="Xem ảnh biến thể phóng to"
                                        onClick={() =>
                                          openImagePreview(
                                            v.thumb,
                                            [
                                              v.name,
                                              row.brand,
                                              v.color,
                                              v.condition,
                                            ]
                                              .map((s) => (s != null ? String(s).trim() : ''))
                                              .filter(Boolean)
                                              .join(' - ') || row.name || 'Biến thể'
                                          )
                                        }
                                      >
                                        <OptimizedImage
                                          src={v.thumb}
                                          alt=""
                                          width={40}
                                          height={40}
                                          sizes="40px"
                                          className="w-full h-full object-cover pointer-events-none"
                                        />
                                      </button>
                                    ) : (
                                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="text-xs text-gray-600 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                                      <span className="text-gray-500 shrink-0">Mã SKU</span>
                                      <code
                                        className="text-[11px] bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded font-mono break-all"
                                        title={v.sku || undefined}
                                      >
                                        {v.sku || '—'}
                                      </code>
                                    </div>
                                    <div className="text-xs text-gray-700 flex flex-wrap gap-x-2 gap-y-0.5">
                                      {v.color ? (
                                        <span>
                                          <span className="text-gray-500">Màu:</span> {v.color}
                                        </span>
                                      ) : null}
                                      {v.condition ? (
                                        <span>
                                          <span className="text-gray-500">TT:</span> {v.condition}
                                        </span>
                                      ) : null}
                                    </div>
                                    {String(v.name || '').trim() ? (
                                      <div className="text-[11px] text-gray-600 break-words leading-snug">
                                        {String(v.name).trim()}
                                      </div>
                                    ) : null}
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                      {Number(v.priceForSale) > 0 ? (
                                        <span className="font-semibold text-gray-900">
                                          Bán: {formatPrice(Number(v.priceForSale))}
                                        </span>
                                      ) : null}
                                      {Number(v.priceDefault) > 0 ? (
                                        <span className="text-gray-500 line-through">
                                          Gốc: {formatPrice(Number(v.priceDefault))}
                                        </span>
                                      ) : null}
                                      {Number(v.salePercent) > 0 ? (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                                          -{v.salePercent}%
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <code
                          className="text-xs font-mono text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 break-all"
                          title={productMaSanPhamCellTitle(row)}
                        >
                          {formatProductMaSanPham(row)}
                        </code>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-sm text-gray-900 break-words" title={row.brand || ''}>
                          {row.brand ? row.brand : <span className="text-gray-400">—</span>}
                        </span>
                      </td>
                      {/* <td className="px-3 py-3 text-right align-top whitespace-nowrap">
                        {row.priceForSale ? (
                          <span className="text-sm font-semibold text-gray-900">
                            {formatPrice(Number(row.priceForSale))}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right align-top whitespace-nowrap">
                        {row.priceDefault ? (
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(Number(row.priceDefault))}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td> */}
                      <td className="px-3 py-3 text-center align-top">
                        {Number(row.salePercent) > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                            -{row.salePercent}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center align-top">
                        {(() => {
                          const checked = Boolean(row.isbestSeller);
                          const saving = bestSellerSavingKeys.has(row.key);
                          return (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={checked}
                              disabled={saving}
                              onClick={() => handleToggleBestSeller(row, !checked)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-150 disabled:opacity-60 disabled:cursor-wait ${
                                checked
                                  ? 'bg-orange-500 border-orange-500'
                                  : 'bg-gray-200 border-gray-300'
                              }`}
                              title={checked ? 'Tắt bán chạy' : 'Bật bán chạy'}
                            >
                              <span
                                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ${
                                  checked ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-sm text-gray-800 break-words">
                          {formatConditionCell(row)}
                        </span>
                      </td>
                      <td className="px-3 py-3 sticky right-0 bg-white group-hover:bg-gray-50 z-30 border-l border-gray-200 align-top w-32">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const obj = row._product || parseProductRecord(row._raw, row._code, row._page);
                              setEditModal({ visible: true, key: row.key, value: obj, page: row._page, code: row._code });
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 p-0 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-all active:scale-95"
                            aria-label={`Sửa ${row.name}`}
                            title="Sửa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {         
                                const rec = tableData.find(r => r.key === row.key);
                                const current = rec._product || parseProductRecord(rec._raw, rec._code, rec._page);
                                handleUpdateProduct(
                                    { ...current,
                                      isHide: !isFilter
                                    },
                                    rec.key,
                                    rec._code,
                                    rec._page
                                  );
                              
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 p-0 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-all active:scale-95"
                            aria-label={`Ẩn ${row.name}`}
                            title="Ẩn"
                          >
                            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.02-2.33 2.88-4.27 5.1-5.57"/>
                        <path d="M1 1l22 22"/>
                        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7a11.76 11.76 0 0 1-4.24 5.5"/>
                        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"/>
                      </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Bạn chắc chắn muốn xóa "${row.name}"?`)) {
                                handleDeleteProduct(row.key, row._code, row._page);
                              }
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 p-0 text-white bg-red-600 rounded-md hover:bg-red-700 transition-all active:scale-95"
                            aria-label={`Xóa ${row.name}`}
                            title="Xóa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!items.length || !tableData.length) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-20">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchText ? 'Không tìm thấy sản phẩm' : 'Danh mục này chưa có sản phẩm'}
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                {searchText ? 'Thử từ khóa khác.' : 'Thêm sản phẩm hoặc chọn danh mục khác.'}
              </p>
              {!searchText && (
                <button
                  type="button"
                  onClick={() => setAddModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm sản phẩm đầu tiên
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editModal.visible && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeEditModal();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-20 border-b border-gray-200 flex items-center justify-between px-6 py-4 rounded-t-2xl">
              <h2 id="edit-modal-title" className="text-xl font-bold text-gray-900">
                Cập nhật sản phẩm
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (formSubmitRef.current?.submit) {
                      formSubmitRef.current.submit();
                    }
                  }}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm active:scale-95"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => closeEditModal()}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Đóng"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto flex-1">
              <div className="p-6">
                <ProductForm
                  ref={formSubmitRef}
                  initialValues={editModal.value}
                  onFinish={async (values) => {
                    try {
                      await handleUpdateProduct(values, editModal.key, editModal.code, editModal.page);
                      if (shouldCloseAfterSave) {
                        setEditModal({ visible: false, key: '', value: '', page: '', code: '' });
                        setHasUnsavedChanges(false);
                        setShouldCloseAfterSave(false);
                      }
                    } catch (error) {
                      // Error đã được xử lý trong handleUpdateProduct
                      console.error('Error in onFinish:', error);
                    }
                  }}
                  onValuesChange={() => {
                    setHasUnsavedChanges(true);
                  }}
                  type="edit"
                  hideSubmitButton={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      {pendingCloseAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Có thay đổi chưa lưu</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                Bạn có thay đổi chưa được lưu. Bạn có muốn lưu các thay đổi này trước khi đóng không?
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleDontSaveAndClose}
                className="px-4 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all"
              >
                Không lưu
              </button>
              <button
                type="button"
                onClick={handleSaveAndClose}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
              >
                Lưu và đóng
              </button>
              <button
                type="button"
                onClick={() => setPendingCloseAction(null)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAddModal(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-modal-title"
        >
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200 flex items-center justify-between px-6 py-4 rounded-t-2xl">
              <h2 id="add-modal-title" className="text-xl font-bold text-gray-900">
                Thêm sản phẩm mới
              </h2>
              <button
                type="button"
                onClick={() => setAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                aria-label="Đóng"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm font-medium text-gray-800">Import từ Excel (2 cách)</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 rounded-md border border-white bg-white/80 px-3 py-2 shadow-sm">
                    <p className="text-xs font-semibold text-gray-600 mb-1">1. Theo SKU</p>
                    <p className="text-xs text-gray-500 mb-2">
                      Chỉ sheet <code className="text-[11px]">BienThe</code> — cập nhật biến thể theo Mã SKU (SP cha
                      tạo bằng Import theo tên, cố định theo Mã SP). File:{' '}
                      <code className="text-[11px]">mau-import-theo-sku.xlsx</code>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadSkuTemplate}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Tải mẫu
                      </button>
                      <button
                        type="button"
                        onClick={() => skuImportInputRef.current?.click()}
                        className="text-xs px-2 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                      >
                        Chọn file
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 rounded-md border border-white bg-white/80 px-3 py-2 shadow-sm">
                    <p className="text-xs font-semibold text-gray-600 mb-1">2. Theo tên sản phẩm</p>
                    <p className="text-xs text-gray-500 mb-2">
                      Nạp <strong>sản phẩm cha</strong> (sheet SanPham, khóa <strong>Mã SP</strong>) + có thể kèm biến
                      thể (BienThe). Khớp Mã SP → tên → tạo mới. Cập nhật giá/tồn theo SKU: dùng Import theo SKU. File:{' '}
                      <code className="text-[11px]">mau-import-theo-ten-san-pham.xlsx</code>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadNameTemplate}
                        disabled={isUpserting}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Tải mẫu
                      </button>
                      <button
                        type="button"
                        onClick={() => nameImportInputRef.current?.click()}
                        disabled={isUpserting}
                        className="text-xs px-2 py-1.5 bg-white border border-gray-400 text-gray-900 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        {isUpserting ? 'Đang xử lý…' : 'Chọn file'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs uppercase tracking-wider text-gray-400">
                    Hoặc form
                  </span>
                </div>
              </div>

              <ProductForm 
                onFinish={async (values) => {
                  try {
                    // ProductForm (thêm mới) đã gọi upsert trước khi gọi onFinish này; chỉ reload + đóng modal
                    const { clearDataCache } = await import('@/lib/data.js');
                    clearDataCache();
                    
                    // Reload lại data từ server
                    setIsLoading(true);
                    const fetchFunctions = {
                      "06-hang-newseal": getAllNewSealTaiNghe,
                      "01-nhet-tai-cu": getAllTaiNgheNhetTai,
                      "02-chup-tai-cu": getAllTaiNgheChupTai,
                      "03-di-dong-cu": getAllLoaDiDong,
                      "04-de-ban-cu": getAllLoaDeBan,
                      "05-loa-karaoke": getAllLoaKaraoke,
                    };
                    
                    const fetchFn = fetchFunctions[category] || getAllTaiNgheNhetTai;
                    fetchFn((data) => {
                      setItems(data);
                      setIsLoading(false);
                      setAddModal(false);
                    });
                  } catch (error) {
                    console.error('Error reloading data after add:', error);
                    setIsLoading(false);
                  }
                }}
                onCloseForm={() => setAddModal(false)} 
              />
            </div>
          </div>
        </div>
      )}
      
      {imagePreview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh phóng to"
          onClick={closeImagePreview}
        >
          <button
            type="button"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[101] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Đóng"
            onClick={closeImagePreview}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <OptimizedImage
            src={imagePreview.src}
            alt={imagePreview.alt}
            width={1600}
            height={1200}
            sizes="100vw"
            className="max-h-[calc(100vh-3rem)] max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default Admin;
