import React, { useState } from 'react'
import { Table, Input, Button, Space, Modal, Select, Row, Col, InputNumber, DatePicker } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

function CTable({ dataSource, columns, action = {}, loading = false }) {
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState(dataSource)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterValues, setFilterValues] = useState({})

  React.useEffect(() => {
    setFilteredData(dataSource)
  }, [dataSource])

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchText(value)
    applyFilterAndSearch(filterValues, value)
  }

  const handleFilter = () => {
    setIsFilterModalOpen(true)
  }

  const getColumnOptions = (col) => {
    if (col.options) return col.options
    const values = dataSource.map(item => item[col.dataIndex]).filter(Boolean)
    return [...new Set(values)]
  }

  const applyFilterAndSearch = (filters, search) => {
    let data = dataSource
    Object.entries(filters).forEach(([key, val]) => {
      const col = columns.find(c => c.dataIndex === key)
      if (!col) return
      if (col.filterType === 'numberRange' && val && (val[0] !== undefined || val[1] !== undefined)) {
        data = data.filter(item => {
          const v = item[key]
          if (val[0] !== undefined && val[1] !== undefined) return v >= val[0] && v <= val[1]
          if (val[0] !== undefined) return v >= val[0]
          if (val[1] !== undefined) return v <= val[1]
          return true
        })
      } else if (col.filterType === 'dateRange' && val && (val[0] || val[1])) {
        data = data.filter(item => {
          const v = item[key] && dayjs(item[key])
          if (!v) return false
          if (val[0] && val[1]) return v.isAfter(dayjs(val[0]).subtract(1, 'day')) && v.isBefore(dayjs(val[1]).add(1, 'day'))
          if (val[0]) return v.isAfter(dayjs(val[0]).subtract(1, 'day'))
          if (val[1]) return v.isBefore(dayjs(val[1]).add(1, 'day'))
          return true
        })
      } else if (col.filterType === 'number' && val !== undefined && val !== '') {
        data = data.filter(item => item[key] === val)
      } else if (col.filterType === 'date' && val) {
        data = data.filter(item => dayjs(item[key]).isSame(dayjs(val), 'day'))
      } else if (val && Array.isArray(val) && val.length > 0) {
        data = data.filter(item => val.includes(item[key]))
      } else if (val) {
        data = data.filter(item =>
          String(item[key] || '').toLowerCase().includes(String(val).toLowerCase())
        )
      }
    })
    if (search) {
      data = data.filter(item =>
        columns.some(col =>
          String(item[col.dataIndex] || '')
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      )
    }
    setFilteredData(data)
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filterValues, [key]: value }
    setFilterValues(newFilters)
  }

  const handleApplyFilter = () => {
    setIsFilterModalOpen(false)
    applyFilterAndSearch(filterValues, searchText)
  }

  const handleClearFilter = () => {
    setFilterValues({})
    setIsFilterModalOpen(false)
    applyFilterAndSearch({}, searchText)
  }

  const enhancedColumns = columns.map((col, colIndex) => {
    let newCol = { ...col }
    // ensure column has a stable unique key for React/Antd
    newCol.key = newCol.key || col.key || col.dataIndex || col.title || `col-${colIndex}`
    const originalRender = newCol.render
    newCol.render = (value, record, idx) => {
      if (Array.isArray(value)) {
        return value.join(', ')
      }
      if (originalRender) return originalRender(value, record, idx)
      return value
    }
    if (col.enableSort) {
      newCol.sorter = (a, b) => {
        if (typeof a[col.dataIndex] === 'number' && typeof b[col.dataIndex] === 'number') {
          return a[col.dataIndex] - b[col.dataIndex]
        }
        return String(a[col.dataIndex] || '').localeCompare(String(b[col.dataIndex] || ''))
      }
    }
    if (col.enableFilter) {
      if (col.filterType === 'numberRange') {
        newCol.filterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
          const [min, max] = selectedKeys[0] || []
          return (
            <div style={{ padding: 8 }}>
              <InputNumber
                placeholder="Từ"
                value={min}
                onChange={val => setSelectedKeys([[val, max]])}
                style={{ width: 90, marginBottom: 8, display: 'block' }}
              />
              <InputNumber
                placeholder="Đến"
                value={max}
                onChange={val => setSelectedKeys([[min, val]])}
                style={{ width: 90, marginBottom: 8, display: 'block' }}
              />
              <Space>
                <Button
                  type="primary"
                  onClick={() => confirm()}
                  size="small"
                  style={{ width: 90 }}
                >
                  Lọc
                </Button>
                <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
                  Xóa
                </Button>
              </Space>
            </div>
          )
        }
        newCol.onFilter = (value, record) => {
          if (!value) return true
          const [min, max] = value
          const v = record[col.dataIndex]
          if (min !== undefined && max !== undefined) return v >= min && v <= max
          if (min !== undefined) return v >= min
          if (max !== undefined) return v <= max
          return true
        }
      } else if (col.filterType === 'number') {
        newCol.filterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
          <div style={{ padding: 8 }}>
            <InputNumber
              placeholder={`Lọc ${col.title}`}
              value={selectedKeys[0]}
              onChange={val => setSelectedKeys(val !== undefined ? [val] : [])}
              style={{ width: 120, marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                size="small"
                style={{ width: 90 }}
              >
                Lọc
              </Button>
              <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
                Xóa
              </Button>
            </Space>
          </div>
        )
        newCol.onFilter = (value, record) => record[col.dataIndex] === value
      } else if (col.filterType === 'dateRange') {
        newCol.filterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
          <div style={{ padding: 8 }}>
            <DatePicker.RangePicker
              value={selectedKeys[0] || []}
              onChange={val => setSelectedKeys([val])}
              format="DD/MM/YYYY"
              style={{ marginBottom: 8, display: 'block' }}
              placeholder={['Từ ngày', 'Đến ngày']}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                size="small"
                style={{ width: 90 }}
              >
                Lọc
              </Button>
              <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
                Xóa
              </Button>
            </Space>
          </div>
        )
        newCol.onFilter = (value, record) => {
          if (!value || !value[0] || !value[1]) return true
          const v = record[col.dataIndex] && dayjs(record[col.dataIndex])
          if (!v) return false
          return v.isAfter(dayjs(value[0]).subtract(1, 'day')) && v.isBefore(dayjs(value[1]).add(1, 'day'))
        }
      } else if (col.filterType === 'date') {
        newCol.filterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
          <div style={{ padding: 8 }}>
            <DatePicker
              value={selectedKeys[0] || null}
              onChange={val => setSelectedKeys(val ? [val] : [])}
              format="DD/MM/YYYY"
              style={{ marginBottom: 8, display: 'block' }}
              placeholder="Chọn ngày"
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                size="small"
                style={{ width: 90 }}
              >
                Lọc
              </Button>
              <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
                Xóa
              </Button>
            </Space>
          </div>
        )
        newCol.onFilter = (value, record) => {
          if (!value) return true
          return dayjs(record[col.dataIndex]).isSame(dayjs(value), 'day')
        }
      } else {
        newCol.filterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder={`Tìm kiếm ${col.title}`}
              value={selectedKeys[0]}
              onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                Tìm kiếm
              </Button>
              <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
                Đặt lại
              </Button>
            </Space>
          </div>
        )
        newCol.onFilter = (value, record) =>
          String(record[col.dataIndex] || '').toLowerCase().includes(String(value).toLowerCase())
      }
    }
    return newCol
  })


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button
          key={action.key}
          type={action.type}
          icon={action.icon}
          onClick={action.onClick}
          danger={action.danger}
          disabled={action.disabled}
          loading={action.loading}
          style={action.style}
          variant={action.variant}
          className={action.className}
          size={action.size || 'middle'}
        >
          {action.label}
        </Button>

        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={handleFilter}
          >
            Lọc nâng cao
          </Button>
          <Input
            placeholder="Tìm kiếm"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={handleSearch}
            allowClear
            className="w-52"
          />
        </Space>
      </div>

      <Table
        dataSource={filteredData}
        columns={enhancedColumns}
        pagination={{ pageSize: 25, showSizeChanger: true, pageSizeOptions: [25, 50] }}
        rowKey={(record, index) => record?.id ?? record?.key ?? record?._id ?? `row-${index}`}
        loading={loading}
        locale={{
          emptyText: 'Không có dữ liệu',
        }}
      />

      <Modal
        title="Lọc nâng cao"
        open={isFilterModalOpen}
        onOk={handleApplyFilter}
        onCancel={() => setIsFilterModalOpen(false)}
        footer={[
          <Button key="clear" onClick={handleClearFilter}>
            Xóa lọc
          </Button>,
          <Button key="cancel" onClick={() => setIsFilterModalOpen(false)}>
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={handleApplyFilter}>
            Áp dụng
          </Button>,
        ]}
      >
        <Row gutter={[8, 8]}>
          {columns.map((col, i) => (
            <Col span={24} key={col.key || col.dataIndex || col.title || i}>
              <div style={{ marginBottom: 8 }}>
                <b>{col.title}</b>
                {col.filterType === 'numberRange' ? (
                  <Input.Group compact>
                    <InputNumber
                      placeholder="Từ"
                      value={filterValues[col.dataIndex]?.[0]}
                      onChange={val => handleFilterChange(col.dataIndex, [val, filterValues[col.dataIndex]?.[1]])}
                      style={{ width: '45%' }}
                    />
                    <span style={{ width: '10%', display: 'inline-block', textAlign: 'center' }}>-</span>
                    <InputNumber
                      placeholder="Đến"
                      value={filterValues[col.dataIndex]?.[1]}
                      onChange={val => handleFilterChange(col.dataIndex, [filterValues[col.dataIndex]?.[0], val])}
                      style={{ width: '45%' }}
                    />
                  </Input.Group>
                ) : col.filterType === 'dateRange' ? (
                  <DatePicker.RangePicker
                    style={{ width: '100%' }}
                    value={filterValues[col.dataIndex] || []}
                    onChange={val => handleFilterChange(col.dataIndex, val)}
                    format="DD/MM/YYYY"
                    placeholder={['Từ ngày', 'Đến ngày']}
                  />
                ) : col.filterType === 'number' ? (
                  <InputNumber
                    placeholder={`Lọc ${col.title}`}
                    value={filterValues[col.dataIndex] || ''}
                    onChange={val => handleFilterChange(col.dataIndex, val)}
                    style={{ width: '100%' }}
                  />
                ) : col.filterType === 'date' ? (
                  <DatePicker
                    style={{ width: '100%' }}
                    value={filterValues[col.dataIndex] || null}
                    onChange={val => handleFilterChange(col.dataIndex, val)}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày"
                  />
                ) : col.enableFilter ? (
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    allowClear
                    placeholder={`Chọn ${col.title}`}
                    value={filterValues[col.dataIndex] || []}
                    onChange={val => handleFilterChange(col.dataIndex, val)}
                    options={getColumnOptions(col).map(opt => ({ label: opt, value: opt }))}
                  />
                ) : (
                  <Input
                    placeholder={`Lọc ${col.title}`}
                    value={filterValues[col.dataIndex] || ''}
                    onChange={e => handleFilterChange(col.dataIndex, e.target.value)}
                  />
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Modal>
    </div>
  )
}

export default CTable