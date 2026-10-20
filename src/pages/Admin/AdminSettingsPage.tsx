import React, { useEffect, useState } from 'react';
import { Card, Form, Input, InputNumber, Button, Typography, Space, Alert, message, Row, Col } from 'antd';
import { BankOutlined, DollarOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import apiClient from '../../api/client';

const { Title, Text } = Typography;

export const AdminSettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/admin/settings');
      form.setFieldsValue(res);
    } catch (err: any) {
      message.error('Không thể tải cấu hình nền tảng: ' + (err.message || 'Lỗi'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      await apiClient.patch('/admin/settings', values);
      message.success('Đã lưu thành công cấu hình tham số nền tảng CELRA!');
      fetchSettings();
    } catch (err: any) {
      message.error('Lưu cấu hình thất bại: ' + (err.message || 'Lỗi'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
          Cấu Hình Tham Số Nền Tảng CELRA
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Quản lý tài khoản ngân hàng nhận thanh toán VietQR, tỷ giá quy đổi Credit và chi phí rà soát bối cảnh tuân thủ
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          bankId: 'MB',
          accountNo: '0987654321',
          accountName: 'CONG TY CP CONG NGHE CELRA VIET NAM',
          creditRate: 2000,
          auditCost: 25,
          freeTierCredits: 100,
        }}
      >
        {/* Section 1: Cổng Thanh Toán & Ngân Hàng Nhận Tiền */}
        <Card
          title={
            <Space>
              <BankOutlined style={{ color: '#2563eb' }} />
              <span>Tài Khoản Ngân Hàng Nhận Tiền Mặc Định (VietQR / SePay)</span>
            </Space>
          }
          bordered={false}
          style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <Alert
            message="Thông tin tài khoản nhận tiền thực tế của CELRA"
            description="Tài khoản này được nhúng tự động vào mã VietQR chuẩn NAPAS247 khi khách hàng chọn thanh toán VietQR thật trên toàn sàn."
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="bankId"
                label={<span style={{ fontWeight: 600 }}>Mã Ngân Hàng (BIN / ShortName)</span>}
                rules={[{ required: true, message: 'Vui lòng nhập mã ngân hàng' }]}
              >
                <Input placeholder="Ví dụ: MB, VCB, TCB, ACB" style={{ height: 42, borderRadius: 8 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="accountNo"
                label={<span style={{ fontWeight: 600 }}>Số Tài Khoản Nhận Tiền</span>}
                rules={[{ required: true, message: 'Vui lòng nhập số tài khoản' }]}
              >
                <Input placeholder="Số tài khoản MBBank" style={{ height: 42, borderRadius: 8 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="accountName"
                label={<span style={{ fontWeight: 600 }}>Tên Chủ Tài Khoản Thụ Hưởng</span>}
                rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản' }]}
              >
                <Input placeholder="Tên công ty in hoa không dấu" style={{ height: 42, borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Section 2: Tỷ Giá Quy Đổi & Chi Phí Rà Soát */}
        <Card
          title={
            <Space>
              <DollarOutlined style={{ color: '#16a34a' }} />
              <span>Định Giá Credit & Hạn Mức Tặng Kèm</span>
            </Space>
          }
          bordered={false}
          style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="creditRate"
                label={<span style={{ fontWeight: 600 }}>Tỷ Giá Quy Đổi (VND / 1 Credit)</span>}
                rules={[{ required: true, message: 'Vui lòng nhập tỷ giá' }]}
                extra="Mặc định: 1 Credit = 2.000 ₫"
              >
                <InputNumber
                  min={100}
                  step={500}
                  addonAfter="₫"
                  style={{ width: '100%', height: 42 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="auditCost"
                label={<span style={{ fontWeight: 600 }}>Phí Rà Soát (Credit / Lần Rà Soát)</span>}
                rules={[{ required: true, message: 'Vui lòng nhập chi phí' }]}
                extra="Mặc định: 25 Credit / thẻ bối cảnh"
              >
                <InputNumber min={1} max={500} style={{ width: '100%', height: 42 }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item
                name="freeTierCredits"
                label={<span style={{ fontWeight: 600 }}>Credit Tặng Cho DN Mới Tạo</span>}
                rules={[{ required: true, message: 'Vui lòng nhập mức tặng' }]}
                extra="Mặc định: 100 Credit ban đầu"
              >
                <InputNumber min={0} max={1000} style={{ width: '100%', height: 42 }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchSettings} loading={loading} style={{ height: 44, borderRadius: 8 }}>
            Hủy Bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            style={{
              height: 44,
              padding: '0 24px',
              borderRadius: 8,
              background: '#2563eb',
              fontWeight: 600,
            }}
          >
            Lưu Toàn Bộ Cấu Hình Nền Tảng
          </Button>
        </div>
      </Form>
    </div>
  );
};
