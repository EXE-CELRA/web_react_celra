import React, { useEffect, useState } from 'react';
import {
  Card,
  Input,
  Button,
  Tag,
  Space,
  Typography,
  Popconfirm,
  Modal,
  Form,
  InputNumber,
  message,
  Tooltip,
} from 'antd';
import {
  LockOutlined,
  UnlockOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import apiClient from '../../api/client';
import { CelraTable } from '../../components/common/CelraTable';
import { CelraFilterBar } from '../../components/common/CelraFilterBar';

const { Title } = Typography;

const INDUSTRY_NAME_MAP: Record<string, string> = {
  TAG_FNB: 'F&B & Nhà hàng',
  TAG_ECOMMERCE: 'Bán lẻ & TMĐT',
  TAG_B2B_SERVICE: 'Dịch vụ B2B & Phần mềm',
  TAG_MANUFACTURING: 'Sản xuất & Kho bãi',
  TAG_EDUCATION: 'Giáo dục & Đào tạo',
  TAG_LOGISTICS: 'Vận tải & Logistics',
};

const formatIndustry = (rawIndustry?: string): string => {
  if (!rawIndustry) return 'Đa ngành';
  let str = rawIndustry.trim();
  if (str.startsWith('ập trình')) {
    str = 'L' + str;
  }
  const parts = str.split(',').map((p) => p.trim());
  const mapped = parts.map((part) => INDUSTRY_NAME_MAP[part] || part);
  return mapped.join(', ');
};

export const AdminEnterprisesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal can thiệp cộng Credit
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [form] = Form.useForm();
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchEnterprises = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchText) params.search = searchText;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res: any = await apiClient.get('/admin/enterprises', { params });
      setEnterprises(Array.isArray(res) ? res : []);
    } catch (err: any) {
      message.error('Không thể tải danh sách doanh nghiệp: ' + (err.message || 'Lỗi server'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterprises();
  }, [statusFilter]);

  const handleToggleStatus = async (record: any) => {
    const newStatus = record.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiClient.patch(`/admin/enterprises/${record.id}/status`, { status: newStatus });
      message.success(`Đã chuyển trạng thái doanh nghiệp sang ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}`);
      fetchEnterprises();
    } catch (err: any) {
      message.error('Không thể cập nhật trạng thái: ' + (err.message || 'Lỗi'));
    }
  };

  const handleOpenAdjustModal = (record: any) => {
    setSelectedOrg(record);
    form.resetFields();
    form.setFieldsValue({
      amount: 50,
      reason: 'Hỗ trợ sự cố kỹ thuật từ Quản trị viên CELRA',
    });
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (values: any) => {
    if (!selectedOrg) return;
    setAdjustLoading(true);
    try {
      await apiClient.post('/admin/finance/adjust-credit', {
        organizationId: selectedOrg.id,
        amount: values.amount,
        reason: values.reason,
        taskName: 'Cộng Credit Từ Quản Trị Viên',
      });
      message.success(`Đã cộng thành công ${values.amount} Credit cho ${selectedOrg.name}`);
      setAdjustModalOpen(false);
      fetchEnterprises();
    } catch (err: any) {
      message.error('Lỗi cộng Credit: ' + (err.message || 'Thất bại'));
    } finally {
      setAdjustLoading(false);
    }
  };

  const columns = [
    {
      title: 'Tên Doanh Nghiệp',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
          {name}
        </span>
      ),
    },
    {
      title: 'Mã Số Thuế',
      dataIndex: 'taxCode',
      key: 'taxCode',
      width: 140,
      align: 'center' as const,
      render: (taxCode: string) => (
        <span style={{ fontWeight: 500, color: '#0f172a', fontSize: 13 }}>
          {taxCode}
        </span>
      ),
    },
    {
      title: 'Loại Hình',
      dataIndex: 'legalType',
      key: 'legalType',
      width: 180,
      render: (legalType: string) => (
        <span style={{ fontSize: 12, color: '#475569' }}>
          {legalType || 'Doanh nghiệp'}
        </span>
      ),
    },
    {
      title: 'Ngành Nghề',
      dataIndex: 'industry',
      key: 'industry',
      width: 250,
      render: (industry: string) => (
        <span style={{ fontWeight: 500, color: '#0f172a', fontSize: 13, lineHeight: 1.4 }}>
          {formatIndustry(industry)}
        </span>
      ),
    },
    {
      title: 'Số Nhân Viên',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      width: 130,
      align: 'center' as const,
      sorter: (a: any, b: any) => (a.employeeCount || 0) - (b.employeeCount || 0),
      render: (count: number) => (
        <span style={{ fontWeight: 500, color: '#0f172a', fontSize: 13 }}>
          {count || 0} nhân sự
        </span>
      ),
    },
    {
      title: 'Số Dư Credit',
      dataIndex: 'creditBalance',
      key: 'creditBalance',
      width: 140,
      align: 'right' as const,
      sorter: (a: any, b: any) => a.creditBalance - b.creditBalance,
      render: (balance: number) => (
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
          {Number(balance || 0).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Tác Vụ',
      dataIndex: 'taskCount',
      key: 'taskCount',
      width: 110,
      align: 'center' as const,
      sorter: (a: any, b: any) => (a.taskCount || 0) - (b.taskCount || 0),
      render: (count: number) => (
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
          {count || 0}
        </span>
      ),
    },
    {
      title: 'Hồ Sơ',
      dataIndex: 'docCount',
      key: 'docCount',
      width: 110,
      align: 'center' as const,
      sorter: (a: any, b: any) => (a.docCount || 0) - (b.docCount || 0),
      render: (count: number) => (
        <span style={{ fontWeight: 500, color: '#475569', fontSize: 13 }}>
          {count || 0}
        </span>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      align: 'center' as const,
      render: (status: string) => {
        const isActive = status === 'ACTIVE';
        return (
          <Tag
            color={isActive ? 'success' : 'error'}
            style={{ borderRadius: 4, fontWeight: 600, fontSize: 12, padding: '2px 8px' }}
          >
            {isActive ? 'Đang hoạt động' : 'Bị tạm khóa'}
          </Tag>
        );
      },
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      align: 'center' as const,
      render: (date: string) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {new Date(date).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const isActive = record.status === 'ACTIVE';
        return (
          <Space size="small">
            <Tooltip title="Cộng bù Credit trực tiếp cho doanh nghiệp này">
              <Button
                size="small"
                type="primary"
                ghost
                icon={<PlusCircleOutlined />}
                onClick={() => handleOpenAdjustModal(record)}
              />
            </Tooltip>

            <Popconfirm
              title={isActive ? 'Khóa doanh nghiệp này?' : 'Mở khóa doanh nghiệp?'}
              description={
                isActive
                  ? 'Doanh nghiệp sẽ bị tạm ngưng các phiên rà soát tuân thủ và nạp tiền.'
                  : 'Cho phép doanh nghiệp tiếp tục sử dụng bình thường.'
              }
              onConfirm={() => handleToggleStatus(record)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Tooltip title={isActive ? 'Khóa doanh nghiệp' : 'Mở khóa doanh nghiệp'}>
                <Button
                  size="small"
                  danger={isActive}
                  type={isActive ? 'default' : 'primary'}
                  icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* Top Header */}
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
          Quản Lý Doanh Nghiệp Trên Hệ Thống
        </Title>
      </div>

      {/* Reusable Filter and Search Bar */}
      <CelraFilterBar
        searchValue={searchText}
        onSearchChange={setSearchText}
        onSearch={fetchEnterprises}
        onRefresh={fetchEnterprises}
        searchPlaceholder="Tìm theo tên công ty, mã số thuế (MST), người đại diện..."
        selectFilter={{
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'ACTIVE', label: 'Đang hoạt động' },
            { value: 'SUSPENDED', label: 'Bị tạm khóa' },
          ],
        }}
      />

      {/* Main Table */}
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <CelraTable
          columns={columns}
          dataSource={enterprises}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1550 }}
          pagination={{
            pageSize: 10,
          }}
        />
      </Card>

      {/* Modal Cộng Credit Can Thiệp */}
      <Modal
        title={
          <Space>
            <PlusCircleOutlined style={{ color: '#7c3aed' }} />
            <span>Cộng Credit Đền Bù Khách Hàng</span>
          </Space>
        }
        open={adjustModalOpen}
        onCancel={() => setAdjustModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        {selectedOrg && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>{selectedOrg.name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              MST: {selectedOrg.taxCode} • Số dư hiện tại: <Tag color="purple">{selectedOrg.creditBalance} Cr</Tag>
            </div>
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleAdjustSubmit}>
          <Form.Item
            name="amount"
            label="Số Credit muốn cộng thêm"
            rules={[{ required: true, message: 'Vui lòng nhập số Credit' }]}
          >
            <InputNumber min={1} max={10000} style={{ width: '100%', height: 40 }} />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do can thiệp (Ghi vào sổ cái giao dịch)"
            rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
          >
            <Input.TextArea rows={3} placeholder="Ví dụ: Đền bù sự cố mạng ngày 19/10/2026..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <Button onClick={() => setAdjustModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={adjustLoading} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
              Xác Nhận Cộng Credit
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
