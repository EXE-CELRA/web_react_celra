import type { EvidenceUploadModalProps } from '../../interfaces';
import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Form, Input, Select, Upload, message, Alert, Row, Col } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import apiClient from '../../api/client';

const RULE_CODE_DEFAULT_META: Record<string, { tag: string; documentType: string }> = {
  'RULE-TAX-TNDN-80': { tag: 'Tạm nộp 80% (1052)', documentType: 'STATE_TREASURY_RECEIPT' },
  'RULE-TAX-TNDN-FINAL': { tag: 'Quyết toán 03/TNDN', documentType: 'TAX_DECLARATION' },
  'RULE-TAX-TNDN-B4': { tag: 'Chi phí & Mục B4', documentType: 'INVOICE_VOUCHER' },
  'RULE-CIT-B4-CASH': { tag: 'Hóa đơn & Ủy nhiệm chi', documentType: 'BANK_PAYMENT_ORDER' },
  'RULE-CIT-B4-SALARY': { tag: 'Thuế TNDN', documentType: 'OTHER' },
  'RULE-TAX-FCT-10D': { tag: 'Thuế nhà thầu (FCT)', documentType: 'OTHER' },
};

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  visible,
  taskId,
  initialTag,
  initialQuarter,
  initialYear,
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

  useEffect(() => {
    if (!visible) return;
    const rulePreset = initialTag ? RULE_CODE_DEFAULT_META[initialTag] : undefined;
    form.setFieldsValue({
      documentType: rulePreset?.documentType || 'TAX_DECLARATION',
      tag: rulePreset?.tag || (initialTag && !initialTag.startsWith('RULE-') ? initialTag : 'Thuế TNDN'),
      quarter: initialQuarter !== undefined ? String(initialQuarter) : 'Cả năm',
      year: initialYear ?? currentYear,
    });
  }, [visible, initialTag, initialQuarter, initialYear, currentYear, form]);

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
    formData.append('category', values.documentType);
    
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
    if (initialTag && initialTag.startsWith('RULE-')) {
      formData.append('metadata', JSON.stringify({ ruleCode: initialTag }));
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
          documentType: 'TAX_DECLARATION',
          tag: 'Thuế TNDN',
          quarter: 'Cả năm',
          year: currentYear,
        }}
      >
        <Alert
          type="info"
          showIcon
          message="Hồ sơ / chứng từ tải lên sẽ được hệ thống lưu lại vào kho Bằng Chứng và cập nhật vào Context Thuế TNDN để hỗ trợ đối soát chi phí & quyết toán."
          style={{ marginBottom: 16 }}
        />
        
        <Form.Item
          name="title"
          label="Tên tài liệu / Tiêu đề chứng từ"
          rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu' }]}
        >
          <Input placeholder="Ví dụ: Bảng kê thu chi Quý 4/2026, Giấy nộp tiền thuế TNDN (1052), Ủy nhiệm chi..." />
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
                  { label: 'Tờ khai quyết toán 03/TNDN & BCTC', value: 'TAX_DECLARATION' },
                  { label: 'Giấy nộp tiền NSNN (Tiểu mục 1052)', value: 'STATE_TREASURY_RECEIPT' },
                  { label: 'Hóa đơn & Bảng kê chi phí B4', value: 'INVOICE_VOUCHER' },
                  { label: 'Ủy nhiệm chi / Sao kê ngân hàng', value: 'BANK_PAYMENT_ORDER' },
                  { label: 'Hồ sơ pháp lý & ĐKKD', value: 'LEGAL_LICENSE' },
                  { label: 'Chứng từ giải trình khác', value: 'OTHER' },
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
                  { label: 'Tạm nộp 80% (1052)', value: 'Tạm nộp 80% (1052)' },
                  { label: 'Quyết toán 03/TNDN', value: 'Quyết toán 03/TNDN' },
                  { label: 'Chi phí & Mục B4', value: 'Chi phí & Mục B4' },
                  { label: 'Hóa đơn & Ủy nhiệm chi', value: 'Hóa đơn & Ủy nhiệm chi' },
                  { label: 'Thuế nhà thầu (FCT)', value: 'Thuế nhà thầu (FCT)' },
                  { label: 'Hồ sơ pháp lý', value: 'Hồ sơ pháp lý' },
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

        <Form.Item label="Chọn tệp chứng từ (PDF, XML, XLSX, DOCX, JPG, PNG)">
          <Upload.Dragger
            accept=".pdf,.xml,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg,.jpeg,.webp"
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
            <p className="ant-upload-hint">Hỗ trợ Hóa đơn điện tử (.xml, .pdf), Excel (.xlsx, .xls, .csv), Word, Ảnh chứng từ (tối đa 25MB — tự động mã hóa AES-256-GCM trên Cloud).</p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
};
