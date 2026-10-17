import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, Typography, message, Modal, Form, Input, Select } from 'antd';
import { AlertOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import apiClient from '../../api/client';
import type { ComplianceFinding, RiskSeverity } from '../../types';
import { SeverityTag } from '../../components/common/StatusBadge';

const { Text, Paragraph } = Typography;

export const FindingsPage: React.FC = () => {
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/findings');
      setFindings(Array.isArray(res) ? res : []);
    } catch (err: any) {
      message.error('Không thể tải danh sách sai lệch tuân thủ');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRemediation = async (finding: ComplianceFinding) => {
    try {
      await apiClient.post(`/findings/${finding.id}/remediation-task`);
      message.success(`Đã tự động sinh nhiệm vụ khắc phục cho rủi ro: ${finding.title}`);
      fetchFindings();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi tạo nhiệm vụ khắc phục');
    }
  };

  const handleCreateFinding = async (values: any) => {
    setSubmitting(true);
    try {
      await apiClient.post('/findings', values);
      message.success('Đã ghi nhận phát hiện rủi ro tuân thủ mới');
      setCreateModalOpen(false);
      form.resetFields();
      fetchFindings();
    } catch (err: any) {
      message.error(err.message || 'Lỗi ghi nhận');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Nội dung rủi ro / Sai lệch phát hiện',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: ComplianceFinding) => (
        <div>
          <Text strong style={{ color: '#cf1322' }}>
            {text}
          </Text>
          <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>{record.description}</div>
          {record.legalBasis && (
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>Cơ sở: {record.legalBasis}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Mức độ nghiêm trọng',
      dataIndex: 'severity',
      key: 'severity',
      width: 150,
      render: (severity: RiskSeverity) => <SeverityTag severity={severity} />,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        const color = status === 'RESOLVED' ? 'green' : status === 'IN_REMEDIATION' ? 'blue' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Khắc phục',
      key: 'actions',
      width: 180,
      render: (_: any, record: ComplianceFinding) => (
        <div>
          {record.remediationTaskId ? (
            <Tag color="cyan">Đã có việc khắc phục</Tag>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => handleCreateRemediation(record)}
            >
              Sinh việc khắc phục
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title={
          <Space>
            <AlertOutlined style={{ color: '#ff4d4f' }} />
            <span>Phát Hiện Sai Lệch & Kế Hoạch Khắc Phục (Findings & Remediation)</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            Ghi Nhận Sai Lệch Mới
          </Button>
        }
        style={{ borderRadius: 10 }}
      >
        <Paragraph type="secondary">
          Quản lý các lỗ hổng tuân thủ, phát hiện sai sót từ kỳ kiểm toán nội bộ hoặc từ Rule Engine. Mỗi rủi ro đều có
          thể chuyển hóa trực tiếp thành một Remediation Task có người phụ trách và hạn định rõ ràng.
        </Paragraph>

        <Table dataSource={findings} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="Ghi Nhận Phát Hiện Sai Lệch Mới"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Lưu Sai Lệch"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateFinding}>
          <Form.Item
            name="title"
            label="Tiêu đề rủi ro"
            rules={[{ required: true, message: 'Vui lòng nhập tên rủi ro' }]}
          >
            <Input placeholder="Ví dụ: Thiếu sổ quản lý lao động, Chưa lập bảng kê hóa đơn hủy..." />
          </Form.Item>

          <Form.Item
            name="severity"
            label="Mức độ nghiêm trọng"
            rules={[{ required: true, message: 'Vui lòng chọn mức độ' }]}
            initialValue="HIGH"
          >
            <Select
              options={[
                { label: 'Rất nguy hiểm (Phạt tiền nặng/Đình chỉ)', value: 'CRITICAL' },
                { label: 'Rủi ro cao (Cảnh báo xử phạt)', value: 'HIGH' },
                { label: 'Rủi ro vừa', value: 'MEDIUM' },
                { label: 'Rủi ro thấp', value: 'LOW' },
              ]}
            />
          </Form.Item>

          <Form.Item name="legalBasis" label="Cơ sở pháp lý / Điều khoản liên quan">
            <Input placeholder="Nghị định 12/2022/NĐ-CP Điều 8" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả chi tiết và hậu quả tiềm tàng"
            rules={[{ required: true, message: 'Vui lòng mô tả' }]}
          >
            <Input.TextArea rows={3} placeholder="Mô tả hiện trạng sai sót và mức phạt dự kiến nếu bị thanh tra..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
