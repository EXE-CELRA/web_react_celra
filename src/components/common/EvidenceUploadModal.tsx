import React, { useState } from 'react';
import { Modal, Form, Input, Select, Upload, message, Alert } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import apiClient from '../../api/client';

interface EvidenceUploadModalProps {
  visible: boolean;
  taskId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  visible,
  taskId,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

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
    if (taskId) {
      formData.append('taskId', taskId);
    }

    try {
      await apiClient.post('/evidence-documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('Đã tải lên và lưu vào Context Doanh Nghiệp thành công!');
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
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Alert
          type="info"
          showIcon
          message="Hồ sơ / chứng từ tải lên sẽ được hệ thống lưu lại và tự động cập nhật vào dữ liệu Context Doanh Nghiệp."
          style={{ marginBottom: 16 }}
        />
        <Form.Item
          name="title"
          label="Tên tài liệu / Tiêu đề chứng từ"
          rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu' }]}
        >
          <Input placeholder="Ví dụ: Giấy phép kinh doanh, Hợp đồng lao động, Tờ khai thuế..." />
        </Form.Item>

        <Form.Item
          name="documentType"
          label="Loại tài liệu"
          rules={[{ required: true, message: 'Vui lòng chọn loại tài liệu' }]}
          initialValue="LEGAL_LICENSE"
        >
          <Select
            options={[
              { label: 'Giấy phép pháp lý / ĐKKD', value: 'LEGAL_LICENSE' },
              { label: 'Tờ khai thuế / Báo cáo tài chính', value: 'TAX_DECLARATION' },
              { label: 'Hợp đồng lao động & Nhân sự', value: 'LABOR_CONTRACT' },
              { label: 'Hóa đơn / Chứng từ thanh toán', value: 'INVOICE_VOUCHER' },
              { label: 'Chứng nhận PCCC / Vệ sinh ATTP', value: 'SAFETY_CERTIFICATE' },
              { label: 'Tài liệu khác', value: 'OTHER' },
            ]}
          />
        </Form.Item>

        <Form.Item label="Chọn tệp (PDF, JPG, PNG, DOCX, XLSX)">
          <Upload.Dragger
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([file]);
              return false;
            }}
            onRemove={() => setFileList([])}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 36, color: '#1677ff' }} />
            </p>
            <p className="ant-upload-text">Kéo thả tệp vào đây hoặc nhấp để chọn tệp từ máy tính</p>
            <p className="ant-upload-hint">Dung lượng tối đa 25MB.</p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
};
