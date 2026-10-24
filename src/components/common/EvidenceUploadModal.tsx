import type { EvidenceUploadModalProps } from '../../interfaces';
import React, { useState, useMemo } from 'react';
import { Modal, Form, Input, Select, Upload, message, Alert, Row, Col } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import apiClient from '../../api/client';

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  visible,
  taskId,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) {
      list.push({ label: `Năm ${y}`, value: y });
    }
    return list;
  }, [currentYear]);

  const handleSubmit = async (values: any) => {
    if (fileList.length === 0) {
      message.error('Vui lòng chọn tệp tài liệu / chứng từ tải lên');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', fileList[0].originFileObj || fileList[0]);
    formData.append('title', values.title);
    formData.append('documentType', values.documentType);
    
    if (values.tag) {
      formData.append('tag', values.tag);
    }
    if (values.quarter) {
      formData.append('quarter', String(values.quarter));
    }
    if (values.year) {
      formData.append('year', String(values.year));
    }
    if (taskId) {
      formData.append('taskId', taskId);
    }

    try {
      await apiClient.post('/evidence-documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('Đã tải lên và lưu vào Hồ Sơ & Bằng Chứng thành công!');
      form.resetFields();
      setFileList([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err.message || 'Tải lên tài liệu thất bại');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      title="Tải Lên Hồ Sơ / Chứng Từ & Lưu Context Doanh Nghiệp"
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={uploading}
      okText="Tải Lên"
      cancelText="Hủy"
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          documentType: 'LEGAL_LICENSE',
          tag: 'Pháp lý & Giấy phép',
          quarter: 'Cả năm',
          year: currentYear,
        }}
      >
        <Alert
          type="info"
          showIcon
          message="Hồ sơ / chứng từ tải lên sẽ được hệ thống lưu lại vào kho Bằng Chứng và cập nhật vào Context Doanh Nghiệp để hỗ trợ rà soát tuân thủ."
          style={{ marginBottom: 16 }}
        />
        
        <Form.Item
          name="title"
          label="Tên tài liệu / Tiêu đề chứng từ"
          rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu' }]}
        >
          <Input placeholder="Ví dụ: Bảng kê thu chi Quý 1/2026, Giấy phép ĐKKD, Hợp đồng lao động..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="documentType"
              label="Phân loại chứng từ"
              rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
            >
              <Select
                options={[
                  { label: 'Tờ khai thuế / BCTC', value: 'TAX_DECLARATION' },
                  { label: 'Hóa đơn / Bảng kê chi phí', value: 'INVOICE_VOUCHER' },
                  { label: 'Giấy phép pháp lý / ĐKKD', value: 'LEGAL_LICENSE' },
                  { label: 'Hợp đồng lao động & Nhân sự', value: 'LABOR_CONTRACT' },
                  { label: 'Chứng nhận PCCC / An toàn', value: 'SAFETY_CERTIFICATE' },
                  { label: 'Tài liệu khác', value: 'OTHER' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="tag"
              label="Tag danh mục"
              rules={[{ required: true, message: 'Vui lòng chọn tag' }]}
            >
              <Select
                options={[
                  { label: 'Bảng kê thu - chi', value: 'Bảng kê thu - chi' },
                  { label: 'Thuế TNDN', value: 'Thuế TNDN' },
                  { label: 'Thuế GTGT', value: 'Thuế GTGT' },
                  { label: 'Hóa đơn chứng từ', value: 'Hóa đơn chứng từ' },
                  { label: 'Lao động & BHXH', value: 'Lao động & BHXH' },
                  { label: 'Pháp lý & Giấy phép', value: 'Pháp lý & Giấy phép' },
                  { label: 'PCCC & An toàn', value: 'PCCC & An toàn' },
                  { label: 'Hợp đồng kinh tế', value: 'Hợp đồng kinh tế' },
                  { label: 'Khác', value: 'Khác' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="quarter" label="Kỳ / Quý áp dụng">
              <Select
                options={[
                  { label: 'Quý 1', value: '1' },
                  { label: 'Quý 2', value: '2' },
                  { label: 'Quý 3', value: '3' },
                  { label: 'Quý 4', value: '4' },
                  { label: 'Cả năm', value: 'Cả năm' },
                  { label: 'Không xác định', value: '' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="year" label="Năm tài chính">
              <Select options={yearOptions} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Chọn tệp (PDF, JPG, PNG, DOCX, XLSX)">
          <Upload.Dragger
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([file]);
              // Tự động gán title nếu title đang trống
              if (!form.getFieldValue('title')) {
                form.setFieldsValue({ title: file.name.replace(/\.[^/.]+$/, '') });
              }
              return false;
            }}
            onRemove={() => setFileList([])}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 36, color: '#1677ff' }} />
            </p>
            <p className="ant-upload-text">Kéo thả tệp vào đây hoặc nhấp để chọn tệp từ máy tính</p>
            <p className="ant-upload-hint">Hỗ trợ Excel (.xlsx, .xls), PDF, Word, Ảnh chứng từ. Dung lượng tối đa 25MB.</p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
};
