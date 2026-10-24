import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Typography,
  Tag,
  Select,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  FolderOpenOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileImageOutlined,
  FileTextOutlined,
  DownloadOutlined,
  FilterOutlined,
  CalendarOutlined,
  TagOutlined,
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

  // Bộ lọc
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

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

  // Tạo danh sách năm động từ dữ liệu và năm hiện tại
  const currentYear = new Date().getFullYear();
  const yearFilterOptions = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(String(currentYear));
    yearsSet.add(String(currentYear - 1));
    documents.forEach((d) => {
      if (d.year) yearsSet.add(String(d.year));
    });
    const sorted = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    return [
      { label: 'Tất cả năm', value: 'ALL' },
      ...sorted.map((y) => ({ label: `Năm ${y}`, value: y })),
    ];
  }, [documents, currentYear]);

  // Danh sách tags duy nhất
  const tagFilterOptions = useMemo(() => {
    const tags = new Set<string>();
    tags.add('Bảng kê thu - chi');
    tags.add('Thuế TNDN');
    tags.add('Thuế GTGT');
    tags.add('Hóa đơn chứng từ');
    tags.add('Lao động & BHXH');
    tags.add('Pháp lý & Giấy phép');
    tags.add('PCCC & An toàn');

    documents.forEach((d) => {
      if (d.tag) tags.add(d.tag);
    });

    return [
      { label: 'Tất cả danh mục (Tags)', value: 'ALL' },
      ...Array.from(tags).map((t) => ({ label: t, value: t })),
    ];
  }, [documents]);

  // Lọc danh sách tài liệu
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Tìm kiếm theo tên
      if (searchText.trim()) {
        const query = searchText.toLowerCase().trim();
        const titleMatch = (doc.title || '').toLowerCase().includes(query);
        const fileMatch = (doc.fileName || '').toLowerCase().includes(query);
        const tagMatch = (doc.tag || '').toLowerCase().includes(query);
        if (!titleMatch && !fileMatch && !tagMatch) return false;
      }

      // Lọc theo Tag
      if (selectedTag !== 'ALL') {
        const currentTag = doc.tag || doc.category;
        if (currentTag !== selectedTag) return false;
      }

      // Lọc theo Năm
      if (selectedYear !== 'ALL') {
        const currentYearVal = doc.year ? String(doc.year) : '';
        if (currentYearVal !== selectedYear) return false;
      }

      // Lọc theo Quý
      if (selectedQuarter !== 'ALL') {
        const currentQuarterVal = doc.quarter ? String(doc.quarter) : '';
        if (currentQuarterVal !== selectedQuarter) return false;
      }

      // Lọc theo trạng thái thẩm định
      if (selectedStatus !== 'ALL') {
        if (doc.verificationStatus !== selectedStatus) return false;
      }

      return true;
    });
  }, [documents, searchText, selectedTag, selectedYear, selectedQuarter, selectedStatus]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = documents.length;
    const taxCount = documents.filter(
      (d) => (d.tag || '').includes('Thuế') || (d.tag || '').includes('thu - chi'),
    ).length;
    const verifiedCount = documents.filter((d) => d.verificationStatus === 'VERIFIED').length;
    const pendingCount = documents.filter((d) => d.verificationStatus === 'PENDING').length;
    return { total, taxCount, verifiedCount, pendingCount };
  }, [documents]);

  const renderFileIcon = (fileName?: string) => {
    if (!fileName) return <FileTextOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return <FileExcelOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
    }
    if (ext === 'pdf') {
      return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
    }
    if (ext === 'docx' || ext === 'doc') {
      return <FileWordOutlined style={{ color: '#1677ff', fontSize: 20 }} />;
    }
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      return <FileImageOutlined style={{ color: '#fa8c16', fontSize: 20 }} />;
    }
    return <FileTextOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />;
  };

  const getTagColor = (tag?: string) => {
    if (!tag) return 'default';
    if (tag.includes('thu - chi') || tag.includes('Bảng kê')) return 'cyan';
    if (tag.includes('TNDN') || tag.includes('GTGT') || tag.includes('Thuế')) return 'blue';
    if (tag.includes('Hóa đơn')) return 'purple';
    if (tag.includes('Lao động') || tag.includes('BHXH')) return 'orange';
    if (tag.includes('Pháp lý')) return 'green';
    if (tag.includes('PCCC')) return 'red';
    return 'geekblue';
  };

  const columns = [
    {
      title: 'Tên chứng từ / Hồ sơ',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: EvidenceDocument) => (
        <div>
          <Space align="start">
            {renderFileIcon(record.fileName)}
            <div>
              <Text strong>{text || record.fileName}</Text>
              <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                Tệp gốc: <span style={{ fontFamily: 'monospace' }}>{record.fileName}</span>
              </div>
            </div>
          </Space>
        </div>
      ),
    },
    {
      title: 'Tag phân loại',
      dataIndex: 'tag',
      key: 'tag',
      width: 170,
      render: (tag: string, record: EvidenceDocument) => {
        const displayTag = tag || record.category || 'Chưa gắn tag';
        return <Tag color={getTagColor(displayTag)}>{displayTag}</Tag>;
      },
    },
    {
      title: 'Kỳ áp dụng (Quý / Năm)',
      key: 'period',
      width: 170,
      render: (_: any, record: EvidenceDocument) => {
        if (record.period) {
          return (
            <Tag icon={<CalendarOutlined />} color="geekblue">
              {record.period}
            </Tag>
          );
        }
        if (record.quarter || record.year) {
          const qVal = String(record.quarter || '');
          const qText = qVal ? (qVal.includes('Quý') || qVal.includes('năm') ? qVal : `Quý ${qVal}`) : '';
          const yText = record.year ? `/${record.year}` : '';
          const label = qText ? `${qText}${yText}` : `Năm ${record.year}`;
          return (
            <Tag icon={<CalendarOutlined />} color="geekblue">
              {label}
            </Tag>
          );
        }
        return <Text type="secondary">---</Text>;
      },
    },
    {
      title: 'Loại tài liệu',
      dataIndex: 'documentType',
      key: 'documentType',
      width: 150,
      render: (type: string) => <Tag>{type || 'OTHER'}</Tag>,
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
            <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 2 }}>
              {record.rejectionReason}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Ngày tải lên',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (date ? new Date(date).toLocaleDateString('vi-VN') : '---'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
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
      {/* Thống kê nhanh */}
      <Row gutter={16}>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic title="Tổng số tài liệu / hồ sơ" value={stats.total} prefix={<FolderOpenOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Bảng kê & Hồ sơ thuế"
              value={stats.taxCount}
              valueStyle={{ color: '#1677ff' }}
              prefix={<FileExcelOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Đã thẩm định hợp lệ"
              value={stats.verifiedCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Chờ thẩm định"
              value={stats.pendingCount}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

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
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Kho lưu trữ tập trung các bảng kê thu - chi, tờ khai thuế, chứng từ hóa đơn, hồ sơ lao động và pháp lý.
          Tài liệu được phân loại tự động theo <b>Tag danh mục</b> và <b>Kỳ thời gian (Quý, Năm)</b> khi tải lên qua luồng rà soát hoặc tải trực tiếp.
        </Paragraph>

        {/* Thanh công cụ lọc */}
        <Card
          size="small"
          style={{
            marginBottom: 16,
            background: '#fafafa',
            borderRadius: 8,
            borderColor: '#f0f0f0',
          }}
        >
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Tìm tên tài liệu, tệp tin..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>

            <Col xs={12} sm={6} md={5}>
              <Select
                style={{ width: '100%' }}
                value={selectedTag}
                onChange={setSelectedTag}
                options={tagFilterOptions}
                suffixIcon={<TagOutlined />}
              />
            </Col>

            <Col xs={12} sm={6} md={4}>
              <Select
                style={{ width: '100%' }}
                value={selectedYear}
                onChange={setSelectedYear}
                options={yearFilterOptions}
                suffixIcon={<CalendarOutlined />}
              />
            </Col>

            <Col xs={12} sm={6} md={4}>
              <Select
                style={{ width: '100%' }}
                value={selectedQuarter}
                onChange={setSelectedQuarter}
                options={[
                  { label: 'Tất cả quý', value: 'ALL' },
                  { label: 'Quý 1', value: '1' },
                  { label: 'Quý 2', value: '2' },
                  { label: 'Quý 3', value: '3' },
                  { label: 'Quý 4', value: '4' },
                  { label: 'Cả năm', value: 'Cả năm' },
                ]}
              />
            </Col>

            <Col xs={12} sm={6} md={5}>
              <Select
                style={{ width: '100%' }}
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { label: 'Tất cả trạng thái', value: 'ALL' },
                  { label: 'Chờ thẩm định', value: 'PENDING' },
                  { label: 'Đã duyệt hợp lệ', value: 'VERIFIED' },
                  { label: 'Bị từ chối', value: 'REJECTED' },
                ]}
                suffixIcon={<FilterOutlined />}
              />
            </Col>
          </Row>
        </Card>

        <Table
          dataSource={filteredDocuments}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng cộng ${total} tài liệu`,
          }}
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
