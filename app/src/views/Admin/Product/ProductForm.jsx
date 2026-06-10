import React, { useEffect, useRef, useState, useMemo, useImperativeHandle, useCallback } from 'react'
import { Form, Input, InputNumber, Select, Button, Row, Col, message, Switch, Modal, Card, Space, Divider, Upload } from 'antd'
import { PlusOutlined, DeleteOutlined, InboxOutlined, ReloadOutlined } from '@ant-design/icons'
// Firebase đã được loại bỏ
import { stringToTableInfo as parseStringToTableInfo, tableInfoToString as parseTableInfoToString } from '@/utils/tableInfo.utils.js'
import ReactQuill from 'react-quill'
import { 
  CATEGORY_TO_COLLECTION,
  BESTSELLER_VALUES,
  CATEGORY_DISPLAY_NAMES,
} from '@/constants'
import { appendProductConditionPresets } from '@/lib/data.save.js'
import {
  applySkuToVariants,
  normalizeSkuSegmentMaps,
  SKU_SEGMENT_CODES_COLLECTION,
} from '@/utils/sku.build.js';
import { useProductDisplayCategories } from '@/hooks/useProductDisplayCategories'
import OptimizedImage from '@/components/common/OptimizedImage'
const reactQuillModules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['blockquote'],
    ['link', 'image'],
    ['clean'],
  ],
}

const reactQuillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet', 'indent',
  'align', 'blockquote', 'code-block',
  'link', 'image'
]

const brandOptions = [
  { label: 'Apple', value: 'Apple' },
  { label: 'Acnos', value: 'Acnos' },
  { label: 'Alpha Works', value: 'Alpha Works' },
  { label: 'Anker', value: 'Anker' },
  { label: 'Bang&Olufsen', value: 'Bang&Olufsen' },
  { label: 'Baseus', value: 'Baseus' },
  { label: 'Beats', value: 'Beats' },
  { label: 'Bose', value: 'Bose' },
  { label: 'Harman Kardon', value: 'Harman Kardon' },
  { label: 'JBL', value: 'JBL' },
  { label: 'Klipsch', value: 'Klipsch' },
  { label: 'Marshall', value: 'Marshall' },
  { label: 'Others', value: 'Others' },
  { label: 'Sennheiser', value: 'Sennheiser' },
  { label: 'Skullcandy', value: 'Skullcandy' },
  { label: 'Sony', value: 'Sony' },
  { label: 'Ultimate Ears', value: 'Ultimate Ears' },
]

/** Gợi ý mặc định; danh sách đầy đủ lấy thêm từ cấu hình server. */
const DEFAULT_CONDITION_LABELS = ['99-98% Nobox', '99-98% Fullbox', 'New Seal']

const labelsToConditionOptions = (labels) =>
  [...new Set(labels)]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'vi'))
    .map((v) => ({ label: v, value: v }))

const mergeServerConditionLabels = (serverArr) => {
  const fromServer = (Array.isArray(serverArr) ? serverArr : [])
    .filter((x) => typeof x === 'string' && x.trim())
    .map((x) => x.trim())
  return labelsToConditionOptions([...DEFAULT_CONDITION_LABELS, ...fromServer])
}

const collectConditionLabelsForPresets = (values, variantsList) => {
  const out = []
  const c = typeof values.condition === 'string' ? values.condition.trim() : ''
  if (c) out.push(c)
  for (const v of variantsList || []) {
    const vc = typeof v?.condition === 'string' ? v.condition.trim() : ''
    if (vc) out.push(vc)
  }
  return out
}

const colorOptions = [
  { label: 'Đen', value: 'Đen', color: '#000000' },
  { label: 'Trắng', value: 'Trắng', color: '#FFFFFF' },
  { label: 'Đỏ', value: 'Đỏ', color: '#FF0000' },
  { label: 'Đỏ đô', value: 'Đỏ đô', color: '#8B0000' },
  { label: 'Xanh dương', value: 'Xanh dương', color: '#0074D9' },
  { label: 'Xanh navy', value: 'Xanh navy', color: '#001F3F' },
  { label: 'Xanh lá', value: 'Xanh lá', color: '#2ECC40' },
  { label: 'Xanh rêu', value: 'Xanh rêu', color: '#556B2F' },
  { label: 'Vàng', value: 'Vàng', color: '#FFDC00' },
  { label: 'Vàng gold', value: 'Vàng gold', color: '#FFD700' },
  { label: 'Cam', value: 'Cam', color: '#FF851B' },
  { label: 'Tím', value: 'Tím', color: '#B10DC9' },
  { label: 'Tím pastel', value: 'Tím pastel', color: '#D1B3FF' },
  { label: 'Hồng', value: 'Hồng', color: '#FF69B4' },
  { label: 'Hồng pastel', value: 'Hồng pastel', color: '#FFD1DC' },
  { label: 'Xám', value: 'Xám', color: '#AAAAAA' },
  { label: 'Xám đậm', value: 'Xám đậm', color: '#555555' },
  { label: 'Bạc', value: 'Bạc', color: '#C0C0C0' },
  { label: 'Nâu', value: 'Nâu', color: '#8B4513' },
  { label: 'Be', value: 'Be', color: '#F5F5DC' },
  { label: 'Xanh ngọc', value: 'Xanh ngọc', color: '#40E0D0' },
  { label: 'Xanh mint', value: 'Xanh mint', color: '#AAF0D1' },
  { label: 'Xanh lam', value: 'Xanh lam', color: '#4682B4' },
  { label: 'Xanh pastel', value: 'Xanh pastel', color: '#B2F9FC' },
  { label: 'Khác', value: 'Khác', color: '#888888' },
]

const ImageUploadField = ({ value = [], onChange, placeholder = 'URL ảnh' }) => {
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const list = Array.isArray(value) ? value : (typeof value === 'string' && value ? value.split(';;').filter(Boolean) : []);
  const listRef = useRef(list);
  listRef.current = list;

  const moveImage = (from, to) => {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    try {
      e.dataTransfer.effectAllowed = 'move';
      // Một số trình duyệt yêu cầu setData mới cho phép drag-drop hoạt động
      e.dataTransfer.setData('text/plain', String(idx));
    } catch {/* noop */}
  };

  const handleDragOver = (e, idx) => {
    if (draggedIdx === null) return;
    e.preventDefault();
    e.stopPropagation();
    try { e.dataTransfer.dropEffect = 'move'; } catch {/* noop */}
    if (overIdx !== idx) setOverIdx(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIdx !== null) {
      moveImage(draggedIdx, idx);
    }
    setDraggedIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setOverIdx(null);
  };

  const addUrl = (url) => {
    const u = (url || '').trim();
    if (!u) return;
    if (!/^(https?:\/\/|data:image\/)/i.test(u) && !u.startsWith('/')) {
      message.warning('Vui lòng nhập URL ảnh hợp lệ (http/https hoặc /uploads/...)');
      return;
    }
    onChange([...list, u]);
    setUrlInput('');
  };

  const removeAt = (idx) => {
    onChange(list.filter((_, i) => i !== idx));
  };

  const handleUpload = ({ file, onSuccess, onError }) => {
    const raw = file?.originFileObj || file;
    if (!raw || !raw.type?.startsWith('image/')) {
      onError(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)'));
      return;
    }
    setUploading(true);

    const appendAndSave = (url) => {
      const prev = listRef.current;
      const next = [...prev, url];
      onChange(next);
      listRef.current = next;
      onSuccess({ url });
    };

    const failAndFallbackBase64 = () => {
      const reader = new FileReader();
      reader.onload = () => {
        fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result }),
        })
          .then((r) => r.json())
          .then((j) => {
            if (j.url) appendAndSave(j.url);
            else onError(new Error(j.error || 'Upload thất bại'));
          })
          .catch((e) => onError(e))
          .finally(() => setUploading(false));
      };
      reader.onerror = () => { setUploading(false); onError(new Error('Đọc file thất bại')); };
      reader.readAsDataURL(raw);
    };

    const formData = new FormData();
    formData.append('image', raw);
    fetch('/api/upload-image-file', { method: 'POST', body: formData })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? 'API không khả dụng' : `Lỗi ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (j.url) appendAndSave(j.url);
        else onError(new Error(j.error || 'Upload thất bại'));
      })
      .catch(() => failAndFallbackBase64())
      .finally(() => setUploading(false));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Upload.Dragger
        customRequest={handleUpload}
        showUploadList={false}
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        multiple
        disabled={uploading}
        style={{ background: '#fafafa', border: '2px dashed #d9d9d9', borderRadius: 8 }}
      >
        <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
          <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text" style={{ margin: 0, fontSize: 14 }}>
          Kéo thả hoặc <span style={{ color: '#1890ff' }}>chọn ảnh</span>
        </p>
        {uploading && <p style={{ margin: '8px 0 0', color: '#1890ff' }}>Đang tải lên…</p>}
      </Upload.Dragger>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onPressEnter={() => addUrl(urlInput)}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Button type="default" onClick={() => addUrl(urlInput)}>Thêm URL</Button>
      </div>

      {list.length > 0 && (
        <>
          <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8, background: '#f5f5f5', borderRadius: 8, maxHeight: 220, overflowY: 'auto' }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setOverIdx(null);
            }}
          >
            {list.map((url, idx) => {
              const isDragging = draggedIdx === idx;
              const isOver = overIdx === idx && draggedIdx !== null && draggedIdx !== idx;
              const borderColor = isOver ? '#1890ff' : (isDragging ? '#bfbfbf' : '#d9d9d9');
              return (
                <div
                  key={`${url}-${idx}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  title="Sắp xếp"
                  style={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: `2px solid ${borderColor}`,
                    boxShadow: isOver ? '0 0 0 2px rgba(24,144,255,0.25)' : 'none',
                    flexShrink: 0,
                    cursor: 'grab',
                    opacity: isDragging ? 0.4 : 1,
                    transition: 'border-color 120ms ease, box-shadow 120ms ease, opacity 120ms ease',
                    userSelect: 'none',
                  }}
                >
                  <OptimizedImage
                    src={url}
                    alt=""
                    width={80}
                    height={80}
                    sizes="80px"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                    draggable={false}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span
                    style={{
                      position: 'absolute', top: 2, left: 2, background: 'rgba(0,0,0,0.6)', color: '#fff',
                      borderRadius: 4, padding: '0 6px', fontSize: 11, lineHeight: '16px', fontWeight: 600,
                      pointerEvents: 'none',
                    }}
                  >{idx + 1}</span>
                  <span
                    onClick={() => removeAt(idx)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer' }}
                    title="Xóa"
                  >×</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const ProductForm = React.forwardRef(({ initialValues = {}, onFinish, onCloseForm, type = "add", onValuesChange: externalOnValuesChange, hideSubmitButton = false }, ref) => {
  const conditionDatalistId = useMemo(
    () => `product-condition-presets-${Math.random().toString(36).slice(2, 11)}`,
    []
  )

  const normalizedInitialValues = useMemo(() => {
    if (!initialValues || typeof initialValues !== 'object') return initialValues || {};
    return {
      ...initialValues,
      loaiSp: initialValues.loaiSp ? initialValues.loaiSp : undefined,
      maSanPham: initialValues.maSanPham ? String(initialValues.maSanPham).trim() : undefined,
      condition: Array.isArray(initialValues.condition) ? initialValues.condition[0] : initialValues.condition,
      colors: Array.isArray(initialValues.colors) ? initialValues.colors[0] : initialValues.colors,
    };
  }, [initialValues]);

  const stabilizeHtmlForQuill = (html) => {
    if (typeof html !== "string") return html;
    return html.replace(/<\/p>\s*<p>(?!)/g, '</p><p></p><p>');
  };

  const initialTableRows = useMemo(() => (
    (initialValues.tableInfo ? parseStringToTableInfo(initialValues.tableInfo) : [{ key: '', value: '' }]).map(r => ({ ...r, value: stabilizeHtmlForQuill(r.value) }))
  ), [initialValues.tableInfo]);

  const [tableRows, setTableRows] = useState(() => (
    initialTableRows.map(r => ({ ...r }))
  ));
  const [category, setCategory] = useState(initialValues.category || '');
  const [colectionName, setColectionName] = useState(
    () => CATEGORY_TO_COLLECTION[initialValues.category || ''] || 'test'
  );
  const [postOptions, setPostOptions] = useState([])
  const [conditionSelectOptions, setConditionSelectOptions] = useState(() =>
    labelsToConditionOptions(DEFAULT_CONDITION_LABELS)
  )
  const [variants, setVariants] = useState(() => {
    if (initialValues.variants && Array.isArray(initialValues.variants)) {
      return initialValues.variants.map(v => ({
        id: v.id || `variant-${Date.now()}-${Math.random()}`,
        name: v.name || '',
        color: v.color || '',
        condition: v.condition || '',
        priceDefault: v.priceDefault || 0,
        priceForSale: v.priceForSale || 0,
        salePercent: v.salePercent || 0,
        inventory: v.inventory || 0,
        images: Array.isArray(v.images) ? v.images : [],
        sku: v.sku || '',
      }));
    }
    return [];
  });

  const { selectOptions, collectionByLabel } = useProductDisplayCategories();
  const categorySelectOptions = useMemo(() => {
    const seen = new Set(selectOptions.map((o) => o.value));
    const extras = Object.values(CATEGORY_DISPLAY_NAMES)
      .filter((l) => !seen.has(l))
      .map((l) => ({ label: l, value: l }));
    return [...selectOptions, ...extras];
  }, [selectOptions]);
  const getCollectionNameByCategory = useCallback(
    (cat) => collectionByLabel[cat] || CATEGORY_TO_COLLECTION[cat] || 'test',
    [collectionByLabel]
  );

  const [form] = Form.useForm();
  const categoryWatch = Form.useWatch('category', form);
  const brandWatch = Form.useWatch('brand', form);
  const nameWatch = Form.useWatch('name', form);
  const loaiSpWatch = Form.useWatch('loaiSp', form);
  const [skuMaps, setSkuMaps] = useState(() => normalizeSkuSegmentMaps(null));

  const loaiSpSelectOptions = useMemo(() => {
    const o = skuMaps?.loaiSp || {};
    return Object.keys(o)
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map((k) => ({ label: `${k} (${o[k]})`, value: k }));
  }, [skuMaps]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { loadCollection } = await import('@/lib/data.js');
        const raw = await loadCollection(SKU_SEGMENT_CODES_COLLECTION, true);
        if (cancelled) return;
        setSkuMaps(normalizeSkuSegmentMaps(Array.isArray(raw) ? {} : raw));
      } catch {
        if (!cancelled) setSkuMaps(normalizeSkuSegmentMaps(null));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshVariantSkus = useCallback(
    (list) => {
      if (!list?.length) return list || [];
      const cat = form.getFieldValue('category') || category;
      const ctx = {
        collectionCode: getCollectionNameByCategory(cat),
        categoryLabel: cat,
        brand: form.getFieldValue('brand') || '',
        productName: form.getFieldValue('name') || '',
        loaiSpLabel: form.getFieldValue('loaiSp') || '',
      };
      return applySkuToVariants(list, ctx, skuMaps);
    },
    [skuMaps, category, form, getCollectionNameByCategory]
  );

  /** Sinh lại SKU cho một biến thể theo brand / tên SP / loại / màu / tình trạng hiện tại */
  const regenerateSkuForVariantIndex = useCallback(
    (index) => {
      const v = variants[index];
      if (!v) return;
      const [refreshed] = refreshVariantSkus([{ ...v }]);
      const sku = refreshed?.sku ?? '';
      if (sku === v.sku) {
        message.info('SKU đã khớp công thức hiện tại.');
        return;
      }
      const next = [...variants];
      next[index] = { ...next[index], sku };
      setVariants(next);
      message.success('Đã sinh SKU mới.');
    },
    [variants, refreshVariantSkus]
  );

  useEffect(() => {
    if (!skuMaps) return;
    setVariants((prev) => {
      if (!prev.length) return prev;
      const cat = categoryWatch || category;
      const ctx = {
        collectionCode: getCollectionNameByCategory(cat),
        categoryLabel: cat,
        brand: brandWatch ?? '',
        productName: nameWatch ?? '',
        loaiSpLabel: loaiSpWatch ?? '',
      };
      const next = applySkuToVariants(prev, ctx, skuMaps);
      const same =
        prev.length === next.length &&
        prev.every((v, i) => v.sku === next[i].sku && v.id === next[i].id);
      return same ? prev : next;
    });
  }, [categoryWatch, brandWatch, nameWatch, loaiSpWatch, skuMaps, category, getCollectionNameByCategory]);

  const descriptionQuillRef = useRef(null)
  const [description, setDescription] = useState(initialValues.description)
  const [descriptionSavedRange, setDescriptionSavedRange] = useState(null);
  const [imageDescriptionUrl, setImageDescriptionUrl] = useState('')
  const [isImageDescriptionModalOpen, setIsImageDescriptionModalOpen] = useState(false);

  const handleDescriptionImageClick = () => {
    const editor = descriptionQuillRef.current?.getEditor()
    const range = editor?.getSelection()
    if (range) setDescriptionSavedRange(range)
    setIsImageDescriptionModalOpen(true)
  };
  const insertDescriptionImage = () => {
    const editor = descriptionQuillRef.current?.getEditor()

    if (!descriptionSavedRange) {
      message.warning('Vui lòng chọn vị trí trong nội dung để chèn ảnh.')
      return;
    }

    if (!imageDescriptionUrl.trim()) {
      message.warning('Vui lòng nhập đường dẫn hình ảnh hợp lệ.')
      return;
    }

    editor.insertEmbed(descriptionSavedRange.index, 'image', imageDescriptionUrl.trim(), 'user')
    setIsImageDescriptionModalOpen(false)
    setImageDescriptionUrl("")
    setDescriptionSavedRange(null)
  };

  

  const handleDescriptionChange = (val) => {
    setDescription(val)
  }
  useEffect(() => {
    if (descriptionQuillRef.current) {
      descriptionQuillRef.current.getEditor().getModule('toolbar').addHandler('image', handleDescriptionImageClick);
    }
  }, []);


  useEffect(() => {
    if (type === 'edit' && initialValues) {
      setTimeout(() => {
        setDescription(initialValues.description || '')
        // Cập nhật variants khi initialValues thay đổi
        if (initialValues.variants && Array.isArray(initialValues.variants)) {
          setVariants(initialValues.variants.map(v => ({
            id: v.id || `variant-${Date.now()}-${Math.random()}`,
            name: v.name || '',
            color: v.color || '',
            condition: v.condition || '',
            priceDefault: v.priceDefault || 0,
            priceForSale: v.priceForSale || 0,
            salePercent: v.salePercent || 0,
            inventory: v.inventory || 0,
            images: Array.isArray(v.images) ? v.images : [],
            sku: v.sku || '',
          })));
        } else {
          setVariants([]);
        }
      }, 0)
    } else {
      setDescription('')
      setVariants([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, initialValues?.variants])


  useEffect(() => {
    setColectionName(getCollectionNameByCategory(category));
  }, [category, getCollectionNameByCategory]);

  useEffect(() => {
    getAllPostTitles();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { loadCollection } = await import('@/lib/data.js');
        const arr = await loadCollection('productConditionPresets', true);
        if (!cancelled) setConditionSelectOptions(mergeServerConditionLabels(arr));
      } catch {
        if (!cancelled) setConditionSelectOptions(labelsToConditionOptions(DEFAULT_CONDITION_LABELS));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);



  const handleAddRow = () => {
    if (tableRows.length >= 10) {
      message.warning('Không thể thêm quá 10 dòng.');
      return;
    }
    setTableRows([...tableRows, { key: '', value: '' }])
  }

  const handleRowChange = (index, field, val) => {
    const newRows = [...tableRows];
    newRows[index][field] = val;
    setTableRows(newRows);
  };

  const handleRemoveRow = (index) => {
    if (tableRows.length <= 1) {
      message.warning('Phải có ít nhất 1 dòng.');
      return;
    }
    const newRows = tableRows.filter((_, i) => i !== index);
    setTableRows(newRows);
  };

  const renderTableRows = () => (

    tableRows.map((row, idx) => (
      <Row gutter={8} key={idx} style={{ marginBottom: 8 }}>
        <Col span={11}>
          <Input
            placeholder="Tên"
            style={{ marginTop: 40 }}
            value={row.key}
            onChange={e => handleRowChange(idx, 'key', e.target.value)}
          />
        </Col>
        <Col span={11}>
          <ReactQuill
            theme="snow"
            placeholder="Nội dung"
            value={row.value}
            formats={reactQuillFormats}
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
              ],
            }}
            onChange={(newContent) => {
              handleRowChange(idx, "value", newContent)
            }
            }
          style={{ minHeight: 100 }}
          />
        </Col>
        <Col span={2}>
          <Button danger onClick={() => handleRemoveRow(idx)}>Xóa</Button>
        </Col>
      </Row>
    ))
  )

  const getAllPostTitles = async () => {
    try {
      const { loadCollection } = await import('@/lib/data');
      const posts = await loadCollection('productPosts');
      const opts = Array.isArray(posts) ? posts.map(post => ({
        value: post.id,
        label: post.title || '(Không có tiêu đề)',
      })) : [];
      setPostOptions(opts);
    } catch {
      setPostOptions([]);
    }
  };

  const handleFinish = async (values) => {
    const result = {
      ...values,
      product_type: values.category, 
      tags: typeof values.tags === 'string' ? values.tags : (Array.isArray(values.tags) ? values.tags.join(',') : ''),
      images: Array.isArray(values.images) ? values.images.join(';;') : (values.images || ''),
      colors: [],
      condition: [],
      priceDefault: 0,
      priceForSale: 0,
      salePercent: 0,
      inventories: values.inventories || 0,
      tableInfo: parseTableInfoToString(tableRows),
      // Map isbestSeller từ form sang isBestSeller để giữ tương thích dữ liệu cũ.
      isBestSeller: values.isbestSeller ? BESTSELLER_VALUES.YES : BESTSELLER_VALUES.NO,
      isbestSeller: values.isbestSeller, 
      videoUrl: values.videoUrl || '', 
      post: values.post || '',
      highlights: '',
      description: description || '',
      loaiSp: typeof values.loaiSp === 'string' ? values.loaiSp.trim() : (values.loaiSp || ''),
      maSanPham: typeof values.maSanPham === 'string' ? values.maSanPham.trim() : (values.maSanPham || ''),
      variants: Array.isArray(values.variants) && values.variants.length > 0 ? values.variants : undefined,
    }
    
    try {
      message.loading({ content: 'Đang lưu sản phẩm...', key: 'addProduct', duration: 0 });

      const collectionName = getCollectionNameByCategory(values.category || category);
      const { appendOrMergeProductRecord } = await import('@/lib/data.save.js');
      const { mergedBySku } = await appendOrMergeProductRecord(result, collectionName);

      message.success({
        content: mergedBySku
          ? 'Đã cập nhật sản phẩm trùng SKU (bổ sung thông tin).'
          : 'Thêm sản phẩm thành công!',
        key: 'addProduct',
      });
    } catch (err) {
      console.error('❌ Thêm sản phẩm thất bại:', err);
      const errorMessage = err.message || 'Thêm sản phẩm thất bại. Vui lòng thử lại.';
      message.error({ content: errorMessage, key: 'addProduct', duration: 5 });
      throw err;
    }
  }

  const handleFormFinish = async (values) => {
    try {
      values.tableInfo = parseTableInfoToString(tableRows);
      values.highlights = '';
      values.description = description ?? '';
      const mergedVariants = refreshVariantSkus(variants);
      if (mergedVariants.length === 0) {
        message.warning({ content: 'Vui lòng thêm ít nhất một biến thể để nhập giá, tình trạng và tồn kho.', key: 'variantRequired' });
        return;
      }

      values.colors = [];
      values.condition = [];
      values.priceDefault = 0;
      values.priceForSale = 0;
      values.salePercent = 0;
      values.variants =
        mergedVariants.map((v) => ({
          ...v,
          condition: typeof v.condition === 'string' ? v.condition.trim() : v.condition,
        }));

      if (onFinish) {
        // Modal Admin truyền onFinish: với thêm mới phải gọi handleFinish (upsert) trước,
        // nếu không sẽ không bao giờ lưu DB nhưng vẫn reload/đóng modal.
        if (type === 'edit') {
          await onFinish(values);
        } else {
          await handleFinish(values);
          await onFinish(values);
        }
      } else {
        await handleFinish(values);
        if (onCloseForm) {
          onCloseForm();
        }
      }

      const presetLabels = collectConditionLabelsForPresets(values, values.variants || variants);
      if (presetLabels.length > 0) {
        try {
          await appendProductConditionPresets(presetLabels);
          const { loadCollection } = await import('@/lib/data.js');
          const arr = await loadCollection('productConditionPresets', true);
          setConditionSelectOptions(mergeServerConditionLabels(arr));
        } catch (e) {
          console.warn('Không cập nhật được danh sách tình trạng trên server:', e);
          message.warning({
            content: 'Đã lưu sản phẩm nhưng không ghi được danh sách tình trạng gợi ý trên server.',
            key: 'conditionPresets',
            duration: 5,
          });
        }
      }
    } catch (error) {
      console.error('Error in handleFormFinish:', error);
      message.error({ content: 'Không thể hoàn tất lưu. Vui lòng thử lại.', key: 'formFinish', duration: 4 });
    }
  }

  useImperativeHandle(ref, () => ({
    submit: () => {
      form.validateFields().then(() => {
        const values = form.getFieldsValue();
        const merged = refreshVariantSkus(variants);
        values.variants = merged.length > 0 ? merged : undefined;
        handleFormFinish(values).catch((err) => {
          console.error('handleFormFinish:', err);
        });
      }).catch(() => {
        message.warning({ content: 'Vui lòng điền đủ thông tin bắt buộc.', key: 'formValidation' });
      });
    },
    getVariants: () => variants,
  }));
  
  const handleVariantPriceChange = (index, field, value) => {
    const newVariants = [...variants];
    const v = newVariants[index];
    const num = Number(value) || 0;
    if (field === 'priceDefault') {
      v.priceDefault = num;
      const pD = v.priceDefault, pF = v.priceForSale, sP = v.salePercent;
      if (pD > 0) {
        if (typeof sP === 'number' && !isNaN(sP) && sP >= 0) {
          v.priceForSale = Math.round(pD * (1 - sP / 100));
        } else if (typeof pF === 'number' && !isNaN(pF) && pF >= 0) {
          v.salePercent = Math.round((1 - pF / pD) * 100);
        }
      }
    } else if (field === 'priceForSale') {
      v.priceForSale = num;
      const pD = v.priceDefault, pF = v.priceForSale;
      if (pD > 0 && pF >= 0) {
        v.salePercent = Math.round((1 - pF / pD) * 100);
      }
    } else if (field === 'salePercent') {
      v.salePercent = num;
      const pD = v.priceDefault, sP = v.salePercent;
      if (pD > 0 && sP >= 0) {
        v.priceForSale = Math.round(pD * (1 - sP / 100));
      }
    }
    setVariants(newVariants);
  };

  const handleAutoCalculate = (changedValues, allValues) => {
    if (externalOnValuesChange) {
      externalOnValuesChange(changedValues, allValues);
    }
    const { priceDefault, priceForSale, salePercent } = allValues;
    const changedField = Object.keys(changedValues)[0];
    if (!changedField) return;

    const pD = Number(priceDefault);
    const pF = Number(priceForSale);
    const sP = Number(salePercent);
    const hasPD = !isNaN(pD) && pD > 0;
    const hasPF = !isNaN(pF) && pF >= 0;
    const hasSP = !isNaN(sP) && sP >= 0;

    // Nhập giá bán → tự tính % giảm: salePercent = (1 - priceForSale/priceDefault) * 100
    if (changedField === 'priceForSale' && hasPD && hasPF) {
      const newPercent = Math.round((1 - pF / pD) * 100);
      form.setFieldsValue({ salePercent: newPercent });
    }
    // Nhập % giảm → tự tính giá bán: priceForSale = priceDefault * (1 - salePercent/100)
    if (changedField === 'salePercent' && hasPD && hasSP) {
      const newPrice = Math.round(pD * (1 - sP / 100));
      form.setFieldsValue({ priceForSale: newPrice });
    }
    // Nhập giá gốc: ưu tiên % giảm để tính giá bán; nếu chưa có % thì dùng giá bán để tính %
    if (changedField === 'priceDefault' && hasPD) {
      if (hasSP) {
        form.setFieldsValue({ priceForSale: Math.round(pD * (1 - sP / 100)) });
      } else if (hasPF) {
        form.setFieldsValue({ salePercent: Math.round((1 - pF / pD) * 100) });
      }
    }
  };


  return (
    <div
      onSubmit={(e) => {
        // Catch any form submissions at the div level
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
    >
      <Form
        layout="vertical"
        initialValues={normalizedInitialValues}
        style={{ maxWidth: '100%', width: '100%' }}
        onFinish={async (values) => {
          // Prevent default form submission behavior
          await handleFormFinish(values);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Form onSubmit prevented');
          return false; // Additional prevention
        }}
        form={form}
        onValuesChange={handleAutoCalculate}
      >
        <datalist id={conditionDatalistId}>
          {conditionSelectOptions.map((o) => (
            <option key={o.value} value={o.value} />
          ))}
        </datalist>
        <Divider orientation="left">Thông tin chung</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Loại SP" name="loaiSp">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={loaiSpSelectOptions}
                placeholder="Chọn"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Thương hiệu" name="brand" rules={[{ required: true, message: 'Vui lòng chọn thương hiệu' }]}>
              <Select options={brandOptions} showSearch placeholder="Chọn thương hiệu" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Mã sản phẩm"
              name="maSanPham"
              extra="Cột ma_san_pham khi import Excel (vd A07050217). Khác mã SKU biến thể."
            >
              <Input allowClear placeholder="A07050217" autoComplete="off" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Danh mục để hiển thị" name="category" rules={[{ required: true, message: 'Vui lòng chọn loại sản phẩm' }]}>
              <Select options={categorySelectOptions} onChange={val => { setCategory(val); form.setFieldsValue({ category: val }) }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Bán chạy" name="isbestSeller" valuePropName="checked">
              <Switch checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>
          </Col>
        </Row>

        {/* Variants Section */}
        <Divider orientation="left">Biến thể</Divider>
        <div style={{ marginBottom: 24 }}>
          <Button 
            type="dashed" 
            onClick={() => {
              const nv = {
                id: `variant-${Date.now()}-${Math.random()}`,
                name: '',
                color: '',
                condition: '',
                priceDefault: 0,
                priceForSale: 0,
                salePercent: 0,
                inventory: 0,
                images: [],
                sku: '',
              };
              setVariants(refreshVariantSkus([...variants, nv]));
            }}
            icon={<PlusOutlined />}
            style={{ width: '100%', marginBottom: 16 }}
          >
            Thêm biến thể
          </Button>

          {variants.map((variant, index) => (
            <Card 
              key={variant.id} 
              title={`Biến thể ${index + 1}`}
              extra={
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setVariants(variants.filter((_, i) => i !== index));
                  }}
                >
                  Xóa
                </Button>
              }
              style={{ marginBottom: 16 }}
            >
              <div className="text-sm text-gray-600 mb-3 flex flex-wrap items-center gap-2">
                <span className="text-gray-500 shrink-0">SKU: </span>
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-900">
                  {variant.sku || '—'}
                </code>
                <Button
                  type="default"
                  size="small"
                  icon={<ReloadOutlined />}
                  className="shrink-0 !text-xs"
                  onClick={() => regenerateSkuForVariantIndex(index)}
                  title="Sinh lại SKU từ thương hiệu, tên SP, loại SP, màu và tình trạng hiện có"
                >
                  Sinh SKU
                </Button>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Tên biến thể" style={{ marginBottom: 16 }}>
                    <Input
                      value={variant.name}
                      onChange={(e) => {
                        const newVariants = [...variants];
                        newVariants[index].name = e.target.value;
                        setVariants(newVariants);
                      }}
                      placeholder=""
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Màu sắc" style={{ marginBottom: 16 }}>
                    <Select
                      value={variant.color}
                      onChange={(val) => {
                        const next = [...variants];
                        next[index].color = val;
                        setVariants(refreshVariantSkus(next));
                      }}
                      placeholder="Màu"
                      optionLabelProp="label"
                      options={colorOptions.map(opt => ({
                        ...opt,
                        label: (
                          <span>
                            <span style={{
                              display: 'inline-block',
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: opt.color,
                              border: '1px solid #ccc',
                              marginRight: 8,
                              verticalAlign: 'middle'
                            }} />
                            {opt.label}
                          </span>
                        )
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Tình trạng" style={{ marginBottom: 16 }}>
                    <Input
                      value={variant.condition}
                      onChange={(e) => {
                        const next = [...variants];
                        next[index].condition = e.target.value;
                        setVariants(refreshVariantSkus(next));
                      }}
                      list={conditionDatalistId}
                      placeholder="Tình trạng"
                      allowClear
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Số lượng tồn kho" style={{ marginBottom: 16 }}>
                    <InputNumber
                      value={variant.inventory}
                      onChange={(val) => {
                        const newVariants = [...variants];
                        newVariants[index].inventory = Number(val) || 0;
                        setVariants(newVariants);
                      }}
                      min={0}
                      style={{ width: '100%' }}
                      placeholder=""
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Giá gốc (VNĐ)" style={{ marginBottom: 16 }}>
                    <InputNumber
                      value={variant.priceDefault}
                      onChange={(val) => handleVariantPriceChange(index, 'priceDefault', val)}
                      min={0}
                      style={{ width: '100%' }}
                      formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' vnđ' : ''}
                      parser={value => value.replace(/[vnđ,]/g, '').trim()}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Giá bán (VNĐ)" style={{ marginBottom: 16 }}>
                    <InputNumber
                      value={variant.priceForSale}
                      onChange={(val) => handleVariantPriceChange(index, 'priceForSale', val)}
                      min={0}
                      style={{ width: '100%' }}
                      formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' vnđ' : ''}
                      parser={value => value.replace(/[vnđ,]/g, '').trim()}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Giảm giá (%)" style={{ marginBottom: 16 }}>
                    <InputNumber
                      value={variant.salePercent}
                      onChange={(val) => handleVariantPriceChange(index, 'salePercent', val)}
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                      formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' %' : ''}
                      parser={value => value.replace(/[\s,%]/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Ảnh biến thể" style={{ marginBottom: 16 }}>
                <ImageUploadField
                  value={variant.images}
                  onChange={(val) => {
                    const newVariants = [...variants];
                    newVariants[index].images = Array.isArray(val) ? val : [];
                    setVariants(newVariants);
                  }}
                  placeholder="URL ảnh"
                />
              </Form.Item>
            </Card>
          ))}
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Video (YouTube)" name="videoUrl">
              <Input placeholder="URL" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Ảnh" name="images">
              <ImageUploadField placeholder="URL ảnh" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Đặc điểm nổi bật">
          <ReactQuill
            ref={descriptionQuillRef}
            theme="snow"
            value={description}
            onChange={handleDescriptionChange}
            modules={reactQuillModules}
            formats={reactQuillFormats}
            style={{ height: '100%', minHeight: 100 }}
          />
        </Form.Item>
        <Form.Item
          label="Bài viết sản phẩm"
          name="post"
          style={{ width: '100%' }} 
        >
          <Select
            mode="single"
            placeholder="Chọn bài viết"
            options={postOptions}
          />
        </Form.Item>

        <Form.Item label="Thông số kỹ thuật">
          {renderTableRows()}
          <Button type="primary" onClick={handleAddRow} style={{ marginTop: 8, color: '#1890ff', border: '1px solid #1890ff', backgroundColor: 'white', borderRadius: '8px', fontWeight: '500' }}>
            Thêm thuộc tính
          </Button>
        </Form.Item>

        {!hideSubmitButton && (
          <Form.Item>
            <div style={{ textAlign: 'right', marginRight: 20 }}>
              <Button 
                type="primary"
                htmlType="button"
                onClick={async () => {
                  try {
                    // Validate form trước khi submit
                    const values = await form.validateFields();
                    await handleFormFinish(values);
                  } catch (errorInfo) {
                    console.log('Validation failed:', errorInfo);
                  }
                }}
              >
                Lưu
              </Button>
            </div>
          </Form.Item>
        )}
      </Form>
      <Modal
        title="Thêm URL Hình ảnh"
        open={isImageDescriptionModalOpen}
        onOk={insertDescriptionImage}
        onCancel={() => setIsImageDescriptionModalOpen(false)}
        okText="Thêm"
        cancelText="Thoát"
      >
        <Input
          value={imageDescriptionUrl}
          onChange={(e) => setImageDescriptionUrl(e.target.value)}
          placeholder="URL ảnh"
        />
      </Modal>
    </div>

  )
});

ProductForm.displayName = 'ProductForm';

export default ProductForm;
