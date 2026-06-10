import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Tabs, Table, Button, Input, message, Typography, Modal } from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  DownloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { loadCollection, clearCollectionCache } from '@/lib/data.js';
import { saveCollectionData, migrateAllProductSkusViaApi } from '@/lib/data.save.js';
import { clearDataCache } from '@/lib/data.js';
import {
  normalizeSkuSegmentMaps,
  SKU_SEGMENT_CODES_COLLECTION,
} from '@/utils/sku.build.js';
import { parseSkuSegmentBook1Workbook } from '@/utils/skuSegmentBook1.excel.js';
import routePath from '@/constants/routePath';

const TAB_DEF = [
  { key: 'brands', label: 'Thương hiệu' },
  { key: 'loaiSp', label: 'Loại SP' },
  { key: 'colors', label: 'Màu sắc' },
  { key: 'conditions', label: 'Tình trạng' },
  { key: 'productNames', label: 'Tên SP → 4 số' },
];

const EMPTY_ROWS = {
  brands: [],
  loaiSp: [],
  colors: [],
  conditions: [],
  productNames: [],
};

function mapToRows(obj) {
  const o = obj && typeof obj === 'object' ? obj : {};
  return Object.entries(o).map(([label, code]) => ({
    rowKey: `${label}::${String(code)}`,
    label,
    code: String(code ?? ''),
  }));
}

function rowsToMap(rows) {
  const o = {};
  for (const r of rows) {
    const lab = (r.label || '').trim();
    const code = (r.code || '').trim();
    if (!lab || !code) continue;
    o[lab] = code;
  }
  return o;
}

function AdminSKUConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState('brands');
  const [persistNote, setPersistNote] = useState('');
  const [rowByTab, setRowByTab] = useState({ ...EMPTY_ROWS });
  const [searchText, setSearchText] = useState('');
  const [migratingSkus, setMigratingSkus] = useState(false);
  const book1InputRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await loadCollection(SKU_SEGMENT_CODES_COLLECTION, true);
      const n = normalizeSkuSegmentMaps(
        Array.isArray(raw) || raw == null ? {} : raw
      );
      setPersistNote(typeof raw?.note === 'string' ? raw.note : n.note || '');
      setRowByTab({
        brands: mapToRows(n.brands),
        loaiSp: mapToRows(n.loaiSp),
        colors: mapToRows(n.colors),
        conditions: mapToRows(n.conditions),
        productNames: mapToRows(n.productNames),
      });
    } catch (e) {
      console.error(e);
      message.error('Không tải được cấu hình mã SKU.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setSearchText('');
  }, [active]);

  const updateCell = useCallback((tab, rowKey, field, value) => {
    setRowByTab((prev) => ({
      ...prev,
      [tab]: prev[tab].map((r) =>
        r.rowKey === rowKey ? { ...r, [field]: value } : r
      ),
    }));
  }, []);

  const addRow = useCallback((tab) => {
    const rowKey = `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setRowByTab((prev) => ({
      ...prev,
      [tab]: [...prev[tab], { rowKey, label: '', code: '' }],
    }));
  }, []);

  const removeRow = useCallback((tab, rowKey) => {
    setRowByTab((prev) => ({
      ...prev,
      [tab]: prev[tab].filter((r) => r.rowKey !== rowKey),
    }));
  }, []);

  const mapCount = (o) => (o && typeof o === 'object' ? Object.keys(o).length : 0);

  const handleBook1ImportChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseSkuSegmentBook1Workbook(buf);
      if (!parsed.ok) {
        Modal.error({
          title: 'Không import được từ Book1',
          width: 680,
          content: (
            <div className="max-h-80 overflow-y-auto text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {parsed.errors.length ? parsed.errors.join('\n') : 'Lỗi không xác định.'}
            </div>
          ),
        });
        return;
      }
      const { maps } = parsed;
      setRowByTab({
        brands: mapToRows(maps.brands),
        loaiSp: mapToRows(maps.loaiSp),
        colors: mapToRows(maps.colors),
        conditions: mapToRows(maps.conditions),
        productNames: mapToRows(maps.productNames),
      });
      message.success({
        content: `Đã nạp ${parsed.dataRows} dòng → ${mapCount(maps.brands)} hãng, ${mapCount(maps.loaiSp)} loại SP, ${mapCount(maps.colors)} màu, ${mapCount(maps.conditions)} tình trạng, ${mapCount(maps.productNames)} tên SP. Nhấn Lưu để ghi vào cấu hình SKU trên server.`,
        duration: 6,
      });
      if (parsed.warnings?.length) {
        message.warning(parsed.warnings.join(' '), 5);
      }
    } catch (err) {
      console.error(err);
      message.error(err?.message || 'Đọc file thất bại.');
    }
  }, []);

  const handleMigrateAllProductSkus = useCallback(() => {
    Modal.confirm({
      title: 'Cập nhật SKU toàn bộ sản phẩm?',
      content: (
        <div className="text-sm text-gray-800 space-y-2">
          <p>
            Mọi biến thể trong <strong>tất cả</strong> kho sản phẩm sẽ được gán lại mã theo bảng phân
            đoạn đang hiển thị (sau khi bạn đã <strong>Lưu</strong> cấu hình SKU trên server).
          </p>
          <p className="text-amber-700">
            Thao tác ghi đè chuỗi SKU trong bảng sản phẩm — nên sao lưu dữ liệu nếu cần.
          </p>
        </div>
      ),
      okText: 'Chạy cập nhật',
      cancelText: 'Hủy',
      width: 520,
      onOk: async () => {
        setMigratingSkus(true);
        try {
          const result = await migrateAllProductSkusViaApi({ dryRun: false, force: true });
          const t = result.totals || {};
          clearDataCache();
          message.success({
            content: `Đã cập nhật ${t.updated ?? 0} dòng sản phẩm (tổng ${t.products ?? 0} bản ghi, ${t.synthetic ?? 0} tạo biến thể mặc định, ${t.bad ?? 0} pipe lỗi).`,
            duration: 6,
          });
        } catch (e) {
          console.error(e);
          message.error(e?.message || 'Chạy migrate thất bại. Bật API: npm run server');
          throw e;
        } finally {
          setMigratingSkus(false);
        }
      },
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        note: persistNote.trim() || undefined,
        brands: rowsToMap(rowByTab.brands),
        loaiSp: rowsToMap(rowByTab.loaiSp),
        colors: rowsToMap(rowByTab.colors),
        conditions: rowsToMap(rowByTab.conditions),
        productNames: rowsToMap(rowByTab.productNames),
      };
      await saveCollectionData(SKU_SEGMENT_CODES_COLLECTION, payload);
      clearCollectionCache(SKU_SEGMENT_CODES_COLLECTION);
      message.success('Đã lưu cấu hình SKU.');
      await loadData();
    } catch (e) {
      console.error(e);
      message.error(e?.message || 'Lưu thất bại. Chạy npm run server để bật API.');
    } finally {
      setSaving(false);
    }
  };

  const filterRows = (tabKey) => {
    const rows = rowByTab[tabKey];
    const q = searchText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.label || '')
          .toLowerCase()
          .includes(q) ||
        String(r.code || '')
          .toLowerCase()
          .includes(q)
    );
  };

  const tabItems = TAB_DEF.map((t) => ({
    key: t.key,
    label: t.label,
    children: (
      <div>
        <Input
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Lọc theo khóa hoặc mã…"
          prefix={<SearchOutlined className="text-gray-400" />}
          className="max-w-md mb-3"
        />
        <Table
          size="small"
          pagination={false}
          rowKey="rowKey"
          dataSource={filterRows(t.key)}
          locale={{
            emptyText: searchText.trim()
              ? 'Không có dòng khớp bộ lọc'
              : 'Chưa có dữ liệu',
          }}
          columns={[
            {
              title: 'Khóa',
              dataIndex: 'label',
              render: (_, record) => (
                <Input
                  value={record.label}
                  onChange={(e) =>
                    updateCell(t.key, record.rowKey, 'label', e.target.value)
                  }
                />
              ),
            },
            {
              title: 'Mã',
              dataIndex: 'code',
              width: 220,
              render: (_, record) => (
                <Input
                  value={record.code}
                  onChange={(e) =>
                    updateCell(t.key, record.rowKey, 'code', e.target.value)
                  }
                />
              ),
            },
            {
              title: '',
              key: 'act',
              width: 56,
              render: (_, record) => (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label="Xóa dòng"
                  onClick={() => removeRow(t.key, record.rowKey)}
                />
              ),
            },
          ]}
        />
        <Button
          type="dashed"
          className="mt-3"
          icon={<PlusOutlined />}
          onClick={() => addRow(t.key)}
        >
          Thêm dòng
        </Button>
      </div>
    ),
  }));

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <Typography.Title level={3} className="!mb-0">
          Cấu hình SKU
        </Typography.Title>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={routePath.admin} className="text-orange-600 text-sm">
            ← Danh sách
          </Link>
          <input
            ref={book1InputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            aria-hidden
            onChange={handleBook1ImportChange}
          />
          <Button
            icon={<UploadOutlined />}
            onClick={() => book1InputRef.current?.click()}
          >
            Import Book1 (.xlsx)
          </Button>
          <Button
            icon={<DownloadOutlined />}
            href="/raws/Book1.xlsx"
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            Tải mẫu Book1
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => handleSave()}
          >
            Lưu
          </Button>
          <Button
            icon={<SyncOutlined />}
            loading={migratingSkus}
            onClick={() => handleMigrateAllProductSkus()}
          >
            Cập nhật SKU toàn bộ SP
          </Button>
        </div>
      </div>

      <Typography.Paragraph type="secondary" className="!mb-3 !text-sm max-w-3xl">
        Import đọc sheet đầu theo bố cục <strong>Book1</strong>: cột A–B hãng (mã dạng Axx), C–D loại SP, E–F màu, G–H
        tình trạng, I–J mã 4 số + tên sản phẩm. Dữ liệu trên các tab sẽ được <strong>thay bằng</strong> nội dung suy ra từ
        file; kiểm tra rồi nhấn <strong>Lưu</strong> để cập nhật server. Sau khi lưu map, có thể nhấn{' '}
        <strong>Cập nhật SKU toàn bộ SP</strong> để gán lại mã trên mọi sản phẩm (cần chạy <span className="font-mono text-xs">npm run server</span>).
      </Typography.Paragraph>

      <Card loading={loading}>
        <Tabs activeKey={active} onChange={setActive} items={tabItems} />
      </Card>
    </div>
  );
}

export default AdminSKUConfig;
