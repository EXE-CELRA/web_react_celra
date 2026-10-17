import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Typography, message, List, Avatar } from 'antd';
import { TeamOutlined, PlusOutlined, LockOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import apiClient from '../../api/client';
import { useWalletStore } from '../../store/useWalletStore';
import type { ExpertCase, ExpertQuote } from '../../types';

const { Text, Paragraph } = Typography;

export const ExpertsPage: React.FC = () => {
  const [cases, setCases] = useState<ExpertCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ExpertCase | null>(null);
  const [quotesModalOpen, setQuotesModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { fetchWallet } = useWalletStore();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/expert-cases');
      setCases(Array.isArray(res) ? res : []);
    } catch (err: any) {
      message.error('Không thể tải danh sách vụ việc chuyên gia');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (values: any) => {
    setSubmitting(true);
    try {
      await apiClient.post('/expert-cases', values);
      message.success('Đã gửi yêu cầu ủy quyền chuyên gia thành công!');
      setCreateModalOpen(false);
      form.resetFields();
      fetchCases();
    } catch (err: any) {
      message.error(err.message || 'Lỗi tạo hồ sơ chuyên gia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenQuotes = (expertCase: ExpertCase) => {
    setSelectedCase(expertCase);
    setQuotesModalOpen(true);
  };

  const handleAcceptQuoteAndHoldEscrow = async (quote: ExpertQuote) => {
    if (!selectedCase) return;
    try {
      await apiClient.post(`/expert-cases/${selectedCase.id}/accept-quote`, {
        quoteId: quote.id,
        expertId: quote.expertId,
        amount: quote.proposedPrice,
      });
      message.success(`Đã chấp thuận báo giá và tạm giữ ký quỹ bảo chứng ${quote.proposedPrice.toLocaleString('vi-VN')} ₫!`);
      setQuotesModalOpen(false);
      fetchCases();
      fetchWallet();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi ký quỹ bảo chứng (Vui lòng kiểm tra số dư ví)');
    }
  };

  const handleCompleteCase = async (expertCase: ExpertCase) => {
    try {
      await apiClient.post(`/expert-cases/${expertCase.id}/complete`, {
        conclusions: 'Đã nghiệm thu kết quả tư vấn và tài liệu bàn giao từ chuyên gia.',
      });
      message.success('Đã giải phóng tiền ký quỹ và hoàn tất vụ việc!');
      fetchCases();
      fetchWallet();
    } catch (err: any) {
      message.error(err.message || 'Lỗi hoàn tất');
    }
  };

  const columns = [
    {
      title: 'Tên vụ việc / Yêu cầu tư vấn chuyên sâu',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: ExpertCase) => (
        <div>
          <Text strong style={{ color: '#1677ff' }}>
            {text}
          </Text>
          <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (cat: string) => <Tag color="purple">{cat}</Tag>,
    },
    {
      title: 'Ngân sách dự kiến',
      dataIndex: 'budgetEstimate',
      key: 'budgetEstimate',
      width: 160,
      render: (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0),
    },
    {
      title: 'Ký quỹ bảo chứng',
      dataIndex: 'escrowAmount',
      key: 'escrowAmount',
      width: 150,
      render: (amount: number) =>
        amount > 0 ? (
          <Tag color="green" icon={<LockOutlined />}>
            {amount.toLocaleString('vi-VN')} ₫
          </Tag>
        ) : (
          <Text type="secondary">Chưa ký quỹ</Text>
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => {
        const color =
          status === 'COMPLETED'
            ? 'green'
            : status === 'ESCROW_FUNDED'
            ? 'blue'
            : status === 'IN_PROGRESS'
            ? 'cyan'
            : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_: any, record: ExpertCase) => (
        <Space>
          {record.status === 'OPEN' || record.status === 'PROPOSALS_RECEIVED' ? (
            <Button size="small" type="primary" onClick={() => handleOpenQuotes(record)}>
              Xem báo giá ({record.quotes?.length || 0})
            </Button>
          ) : null}

          {record.status === 'ESCROW_FUNDED' || record.status === 'IN_PROGRESS' || record.status === 'DELIVERED' ? (
            <Button
              size="small"
              type="primary"
              style={{ backgroundColor: '#52c41a' }}
              icon={<CheckCircleOutlined />}
              onClick={() => handleCompleteCase(record)}
            >
              Nghiệm thu & Giải phóng
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title={
          <Space>
            <TeamOutlined style={{ color: '#1677ff' }} />
            <span>Mạng Lưới Chuyên Gia & Ủy Quyền Ngoài Phạm Vi (Expert Cases & Escrow)</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            Ủy Quyền Việc Ngoài Gói
          </Button>
        }
        style={{ borderRadius: 10 }}
      >
        <Paragraph type="secondary">
          Đối với các vấn đề phức tạp vượt ngoài phạm vi dịch vụ tiêu chuẩn (Out-of-scope) như: Tranh chấp thuế, Đăng ký
          bảo hộ nhãn hiệu quốc tế, Giấy phép PCCC công trình phức tạp... Doanh nghiệp có thể ủy quyền cho Chuyên gia
          độc lập với cơ chế bảo chứng ký quỹ (Escrow) an toàn tuyệt đối.
        </Paragraph>

        <Table dataSource={cases} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Modal Create Expert Case */}
      <Modal
        title="Yêu Cầu Ủy Quyền Chuyên Gia Tư Vấn / Thẩm Định"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Gửi Yêu Cầu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateCase}>
          <Form.Item
            name="title"
            label="Tiêu đề yêu cầu"
            rules={[{ required: true, message: 'Vui lòng nhập tên công việc' }]}
          >
            <Input placeholder="Ví dụ: Thẩm tra quyết toán thuế thu nhập doanh nghiệp 3 năm..." />
          </Form.Item>

          <Form.Item name="category" label="Lĩnh vực chuyên môn" initialValue="TAX_DISPUTE">
            <Input placeholder="Luật doanh nghiệp, Thuế chuyên sâu, PCCC, Đất đai..." />
          </Form.Item>

          <Form.Item
            name="budgetEstimate"
            label="Ngân sách dự kiến (VND)"
            rules={[{ required: true, message: 'Vui lòng nhập ngân sách' }]}
            initialValue={5000000}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0)}
              step={500000}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả chi tiết nội dung cần chuyên gia hỗ trợ"
            rules={[{ required: true, message: 'Vui lòng mô tả chi tiết' }]}
          >
            <Input.TextArea rows={4} placeholder="Nêu rõ tình trạng hồ sơ, mục tiêu cần đạt được và thời hạn mong muốn..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal View Quotes */}
      <Modal
        title={`Danh Sách Báo Giá Chuyên Gia: ${selectedCase?.title || ''}`}
        open={quotesModalOpen}
        onCancel={() => setQuotesModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setQuotesModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={650}
      >
        {!selectedCase?.quotes || selectedCase.quotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Text type="secondary">Hệ thống đang gửi yêu cầu đến các chuyên gia phù hợp trong mạng lưới.</Text>
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={selectedCase.quotes}
            renderItem={(quote) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    icon={<LockOutlined />}
                    onClick={() => handleAcceptQuoteAndHoldEscrow(quote)}
                  >
                    Ký Quỹ & Chọn Chuyên Gia
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#722ed1' }} />}
                  title={
                    <Space>
                      <Text strong>{quote.expertName}</Text>
                      <Tag color="green">{quote.proposedPrice.toLocaleString('vi-VN')} ₫</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>Thời gian thực hiện: {quote.deliveryTimeline}</div>
                      <div style={{ fontStyle: 'italic', marginTop: 4 }}>"{quote.proposalNote}"</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};
