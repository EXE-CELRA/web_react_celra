import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, message, Typography, Tag } from 'antd';
import {
  FolderOpenOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilePdfOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import apiClient from '../../api/client';
import type { EvidenceDocument, VerificationStatus } from '../../types';
import { VerificationStatusTag } from '../../components/common/StatusBadge';
import { EvidenceUploadModal } from '../../components/common/EvidenceUploadModal';

const { Text, Paragraph } = Typography;

export const EvidencePage: React.FC = () => {
  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [verifyDoc, setVerifyDoc] = useState<EvidenceDocument | null>(null);
  const [rejectForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/evidence-documents');
      setDocuments(Array.isArray(res) ? res : []);
    } catch (err: any) {
      message.error('Không thể tải danh sách tài liệu minh chứng');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doc: EvidenceDocument, status: VerificationStatus, reason?: string) => {
    setSubmitting(true);
    try {
      await apiClient.patch(`/evidence-documents/${doc.id}/verify`, {
        status,
        rejectionReason: reason,
      });
      message.success(`Đã cập nhật trạng thái thẩm định: ${status}`);
      setVerifyDoc(null);
      rejectForm.resetFields();
      fetchDocuments();
    } catch (err: any) {
      message.error(err.message || 'Lỗi cập nhật thẩm định');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Tên chứng từ / Hồ sơ',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: EvidenceDocument) => (
        <div>
          <Space>
            <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
            <Text strong>{text || record.fileName}</Text>
          </Space>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>Tệp: {record.fileName}</div>
        </div>
      ),
    },
    {
      title: 'Loại tài liệu',
      dataIndex: 'documentType',
      key: 'documentType',
      width: 170,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Dung lượng',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 110,
      render: (bytes: number) =>
        bytes ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : '---',
    },
    {
      title: 'Trạng thái thẩm định',
      dataIndex: 'verificationStatus',
      key: 'verificationStatus',
      width: 160,
      render: (status: VerificationStatus, record: EvidenceDocument) => (
        <div>
          <VerificationStatusTag status={status} />
          {record.rejectionReason && (
            <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 2 }}>{record.rejectionReason}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Ngày tải lên',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 220,
      render: (_: any, record: EvidenceDocument) => {
        const fileFullUrl = record.fileUrl.startsWith('http')
          ? record.fileUrl
          : `http://localhost:3000${record.fileUrl}`;

        return (
          <Space>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              href={fileFullUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tải về
            </Button>
            {record.verificationStatus === 'PENDING' && (
              <>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  style={{ backgroundColor: '#52c41a' }}
                  onClick={() => handleVerify(record, 'VERIFIED')}
                >
                  Duyệt
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => setVerifyDoc(record)}
                >
                  Từ chối
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title={
          <Space>
            <FolderOpenOutlined style={{ color: '#1677ff' }} />
            <span>Kho Hồ Sơ & Chứng Từ Minh Chứng (Evidence Vault)</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalOpen(true)}>
            Tải Lên Chứng Từ
          </Button>
        }
        style={{ borderRadius: 10 }}
      >
        <Paragraph type="secondary">
          Kho lưu trữ tập trung các hồ sơ pháp lý, báo cáo thuế, bảng lương, chứng nhận PCCC và hợp đồng đã được số hóa.
          Chuyên gia thẩm định (Verifier) có thể kiểm tra và xác nhận tính hợp lệ của từng tài liệu.
        </Paragraph>

        <Table
          dataSource={documents}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Từ Chối Tài Liệu Chứng Từ"
        open={!!verifyDoc}
        onCancel={() => setVerifyDoc(null)}
        onOk={() => rejectForm.submit()}
        confirmLoading={submitting}
        okText="Xác Nhận Từ Chối"
        okButtonProps={{ danger: true }}
      >
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={(values) => {
            if (verifyDoc) handleVerify(verifyDoc, 'REJECTED', values.reason);
          }}
        >
          <Form.Item
            name="reason"
            label="Lý do không hợp lệ / Cần bổ sung"
            rules={[{ required: true, message: 'Vui lòng nêu rõ lý do' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Thiếu chữ ký số của người đại diện PL, File mờ không đọc được..."
            />
          </Form.Item>
        </Form>
      </Modal>

      <EvidenceUploadModal
        visible={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={fetchDocuments}
      />
    </div>
  );
};
