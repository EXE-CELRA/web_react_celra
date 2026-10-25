import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Space,
  Typography,
  message,
} from 'antd';
import {
  DollarCircleOutlined,
  WalletOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import apiClient from '../../api/client';
import { CelraTable } from '../../components/common/CelraTable';
import { CelraFilterBar } from '../../components/common/CelraFilterBar';

const { Title, Text } = Typography;

export const AdminFinancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [financeData, setFinanceData] = useState<any>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);

  // Filter & Search
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal Cộng Credit
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustForm] = Form.useForm();
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Modal Sửa Gói
  const [editPkgModalOpen, setEditPkgModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [pkgForm] = Form.useForm();
  const [pkgLoading, setPkgLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [finRes, orgsRes]: [any, any] = await Promise.all([
        apiClient.get('/admin/finance/overview'),
        apiClient.get('/admin/enterprises'),
      ]);
      setFinanceData(finRes);
      setEnterprises(Array.isArray(orgsRes) ? orgsRes : []);
    } catch (err: any) {
      message.error('Không thể tải dữ liệu tài chính: ' + (err.message || 'Lỗi server'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdjustSubmit = async (values: any) => {
    setAdjustLoading(true);
    try {
      await apiClient.post('/admin/finance/adjust-credit', {
        organizationId: values.organizationId,
        amount: values.amount,
        reason: values.reason,
        taskName: values.taskName || 'Cộng Credit Đền Bù Từ Admin',
      });
      message.success('Đã can thiệp cộng Credit đền bù thành công!');
      setAdjustModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error('Cộng Credit thất bại: ' + (err.message || 'Lỗi'));
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleEditPackage = (pkg: any) => {
    setSelectedPkg(pkg);
    pkgForm.setFieldsValue({
      name: pkg.name,
      priceVnd: pkg.priceVnd,
      credits: pkg.credits,
      bonusCredits: pkg.bonusCredits,
      badge: pkg.badge,
    });
    setEditPkgModalOpen(true);
  };

  const handleSavePackage = async (values: any) => {
    if (!selectedPkg) return;
    setPkgLoading(true);
    try {
      await apiClient.patch('/admin/finance/packages', {
        packageId: selectedPkg.id,
        ...values,
      });
      message.success(`Đã cập nhật cấu hình ${values.name} thành công!`);
      setEditPkgModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error('Cập nhật gói thất bại: ' + (err.message || 'Lỗi'));
    } finally {
      setPkgLoading(false);
    }
  };

  const revenueStats = financeData?.revenueStats || {};
  const packages = financeData?.packages || [];
  const rawTransactions = financeData?.recentTransactions || [];

  const filteredTransactions = rawTransactions.filter((tx: any) => {
    const matchesSearch =
      !searchText ||
      tx.code?.toLowerCase().includes(searchText.toLowerCase()) ||
      tx.orgName?.toLowerCase().includes(searchText.toLowerCase()) ||
      tx.taxCode?.includes(searchText);

    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const columns = [
    {
      title: 'Mã GD',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Text code strong style={{ color: '#2563eb' }}>{code}</Text>,
    },
    {
      title: 'Doanh Nghiệp',
      dataIndex: 'orgName',
      key: 'orgName',
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>MST: {record.taxCode || '---'}</div>
        </div>
      ),
    },
    {
      title: 'Diễn Giải Nghiệp Vụ',
      key: 'taskName',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
            {record.taskName}
          </div>
          {record.note && (
            <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
              Ghi chú: {record.note}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Số Tiền / Credit',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: any) => {
        const isDeposit = record.type === 'deposit';
        return (
          <Text strong style={{ color: isDeposit ? '#16a34a' : '#ea580c', fontSize: 14 }}>
            {isDeposit ? `+${amount.toLocaleString('vi-VN')} ₫ / Cr` : `-${amount.toLocaleString('vi-VN')} Cr`}
          </Text>
        );
      },
    },
    {
      title: 'Loại GD',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        if (type === 'deposit') return <Tag color="green">Nạp Tiền (Deposit)</Tag>;
        if (type === 'capture') return <Tag color="blue">Rà Soát (Capture)</Tag>;
        if (type === 'refund') return <Tag color="orange">Hoàn Tiền (Refund)</Tag>;
        return <Tag>{type}</Tag>;
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'success' : 'error'} style={{ fontWeight: 600, borderRadius: 4 }}>
          {status === 'success' ? 'THÀNH CÔNG' : 'THẤT BẠI'}
        </Tag>
      ),
    },
    {
      title: 'Thời Gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: string) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {new Date(time).toLocaleString('vi-VN')}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Page Title & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Quản Trị Doanh Thu & Sổ Cái Toàn Hệ Thống
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Kiểm soát tổng dòng tiền nạp vào sàn qua VietQR / SePay, cấu hình các gói Credit và tra cứu sổ cái giao dịch
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
            onClick={() => {
              adjustForm.resetFields();
              setAdjustModalOpen(true);
            }}
          >
            Cộng Credit Đền Bù
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Làm Mới
          </Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: '#64748b' }}>TỔNG DOANH THU THỰC TẾ (VND)</span>}
              value={revenueStats.totalRevenueVnd || 0}
              formatter={(val) => `${Number(val).toLocaleString('vi-VN')} ₫`}
              prefix={<DollarCircleOutlined style={{ color: '#16a34a', marginRight: 8 }} />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#16a34a' }}>
              Dòng tiền thực thu qua VietQR & SePay Gateway
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: '#64748b' }}>TỔNG CREDIT ĐÃ TIÊU THỤ</span>}
              value={revenueStats.totalCreditsSpent || 0}
              suffix={<span style={{ fontSize: 14, color: '#64748b' }}>Credit</span>}
              prefix={<WalletOutlined style={{ color: '#7c3aed', marginRight: 8 }} />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              Tương đương ~{((revenueStats.totalCreditsSpent || 0) * 2000).toLocaleString('vi-VN')} ₫ giá trị rà soát
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: '#64748b' }}>DOANH THU RÒNG (NET REVENUE)</span>}
              value={revenueStats.netRevenueVnd || 0}
              formatter={(val) => `${Number(val).toLocaleString('vi-VN')} ₫`}
              prefix={<SafetyCertificateOutlined style={{ color: '#2563eb', marginRight: 8 }} />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              Sau khi đã trừ các khoản hoàn tiền giao dịch
            </div>
          </Card>
        </Col>
      </Row>

      {/* Credit Packages Configuration */}
      <Card
        title="Quản Lý & Chỉnh Sửa Bảng Giá Gói Credit Toàn Hệ Thống"
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <Row gutter={[16, 16]}>
          {packages.map((pkg: any) => (
            <Col xs={24} sm={8} key={pkg.id}>
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 20,
                  background: pkg.id === 'standard' ? '#f5f3ff' : '#ffffff',
                  borderColor: pkg.id === 'standard' ? '#c4b5fd' : '#e2e8f0',
                  position: 'relative',
                }}
              >
                {pkg.badge && (
                  <Tag
                    color={pkg.id === 'standard' ? 'purple' : 'blue'}
                    style={{ position: 'absolute', top: 12, right: 12, borderRadius: 4 }}
                  >
                    {pkg.badge}
                  </Tag>
                )}
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                  {pkg.name}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                  {pkg.priceVnd.toLocaleString('vi-VN')} ₫
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>
                  • Số Credit chính: <strong>{pkg.credits} Credit</strong>
                </div>
                <div style={{ fontSize: 13, color: '#16a34a', marginBottom: 16 }}>
                  • Tặng thêm: <strong>+{pkg.bonusCredits} Credit thưởng</strong>
                </div>
                <Button
                  block
                  icon={<EditOutlined />}
                  onClick={() => handleEditPackage(pkg)}
                  style={{ borderRadius: 6 }}
                >
                  Chỉnh Sửa Gói Này
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Global Ledger Table */}
      <Card
        title="Sổ Cái Giao Dịch Toàn Sàn (Toàn Bộ Biến Động Số Dư)"
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <div style={{ marginBottom: 16 }}>
          <CelraFilterBar
            borderedCard={false}
            searchValue={searchText}
            onSearchChange={setSearchText}
            searchPlaceholder="Tìm theo Mã GD, tên doanh nghiệp hoặc MST..."
            searchWidth={340}
            selectFilter={{
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { value: 'all', label: 'Tất cả loại giao dịch' },
                { value: 'deposit', label: 'Nạp tiền (Deposit)' },
                { value: 'capture', label: 'Trừ tiền rà soát (Capture)' },
                { value: 'refund', label: 'Hoàn tiền (Refund)' },
              ],
            }}
          />
        </div>

        <CelraTable
          columns={columns}
          dataSource={filteredTransactions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total: number, range: [number, number]) =>
              `${range[0]}-${range[1]} trên tổng số ${total} giao dịch`,
          }}
        />
      </Card>

      {/* Modal Cộng Credit Đền Bù */}
      <Modal
        title={
          <Space>
            <PlusCircleOutlined style={{ color: '#7c3aed' }} />
            <span>Cộng Credit Can Thiệp Cho Khách Hàng</span>
          </Space>
        }
        open={adjustModalOpen}
        onCancel={() => setAdjustModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={adjustForm} layout="vertical" onFinish={handleAdjustSubmit}>
          <Form.Item
            name="organizationId"
            label="Chọn Doanh Nghiệp Thụ Hưởng"
            rules={[{ required: true, message: 'Vui lòng chọn doanh nghiệp' }]}
          >
            <Select
              showSearch
              placeholder="Gõ tên hoặc MST để tìm..."
              optionFilterProp="label"
              options={enterprises.map((org) => ({
                value: org.id,
                label: `${org.name} (MST: ${org.taxCode}) - Hiện có: ${org.creditBalance} Cr`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Số lượng Credit cần cộng bù"
            rules={[{ required: true, message: 'Vui lòng nhập số Credit' }]}
            initialValue={50}
          >
            <InputNumber min={1} max={50000} style={{ width: '100%', height: 40 }} />
          </Form.Item>

          <Form.Item
            name="taskName"
            label="Tên bút toán trong Sổ cái"
            initialValue="Cộng Credit Đền Bù Kỹ Thuật Từ Admin"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do can thiệp (Bắt buộc để kiểm toán)"
            rules={[{ required: true, message: 'Vui lòng nhập lý do can thiệp' }]}
          >
            <Input.TextArea rows={3} placeholder="Ví dụ: Đền bù khách hàng phản hồi sự cố mạng..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <Button onClick={() => setAdjustModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={adjustLoading} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
              Xác Nhận Cộng Credit
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Chỉnh Sửa Gói Credit */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#2563eb' }} />
            <span>Chỉnh Sửa Gói Credit: {selectedPkg?.name}</span>
          </Space>
        }
        open={editPkgModalOpen}
        onCancel={() => setEditPkgModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={pkgForm} layout="vertical" onFinish={handleSavePackage}>
          <Form.Item
            name="name"
            label="Tên Gói"
            rules={[{ required: true, message: 'Vui lòng nhập tên gói' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="priceVnd"
            label="Giá Bán (VND)"
            rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
          >
            <InputNumber min={10000} step={10000} style={{ width: '100%', height: 40 }} />
          </Form.Item>

          <Form.Item
            name="credits"
            label="Số Credit Gốc"
            rules={[{ required: true, message: 'Vui lòng nhập số Credit gốc' }]}
          >
            <InputNumber min={1} style={{ width: '100%', height: 40 }} />
          </Form.Item>

          <Form.Item
            name="bonusCredits"
            label="Credit Thưởng Thêm (Bonus)"
          >
            <InputNumber min={0} style={{ width: '100%', height: 40 }} />
          </Form.Item>

          <Form.Item
            name="badge"
            label="Nhãn Nổi Bật (Ví dụ: Khuyên dùng, Tiết kiệm nhất)"
          >
            <Input placeholder="Để trống nếu không dùng nhãn" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <Button onClick={() => setEditPkgModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={pkgLoading}>
              Lưu Thay Đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
