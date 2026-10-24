import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Avatar,
  Tag,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CheckCircleFilled,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updateProfile } = useAuthStore();

  const displayName = user?.name || user?.fullName || 'Người dùng';
  const displayEmail = user?.email || '';
  const displayPhone = user?.phone || user?.phoneNumber || '';
  const displayRole = user?.roleTitle || user?.role || user?.systemRole || 'Doanh nghiệp';

  // Sync form values when modal opens or user updates
  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        name: displayName,
        email: displayEmail,
        phone: displayPhone,
      });
    }
  }, [open, user, displayName, displayEmail, displayPhone, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      await updateProfile({
        name: values.name.trim(),
        phone: values.phone ? values.phone.trim() : '',
        email: values.email.trim(),
      });

      message.success('Cập nhật thông tin hồ sơ cá nhân thành công!');
      onClose();
    } catch (err: any) {
      if (err?.errorFields) {
        return;
      }
      message.error(err?.response?.data?.message || err?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      width={560}
      centered
      destroyOnClose
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      {/* Banner & Avatar Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0958d9 0%, #1677ff 50%, #69b1ff 100%)',
          padding: '28px 24px 20px',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ position: 'relative' }}>
            <Avatar
              size={74}
              icon={<UserOutlined />}
              style={{
                backgroundColor: '#ffffff',
                color: '#1677ff',
                fontSize: 32,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '3px solid rgba(255,255,255,0.85)',
              }}
            >
              {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#52c41a',
                borderRadius: '50%',
                width: 18,
                height: 18,
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Đang hoạt động"
            >
              <CheckCircleFilled style={{ color: '#fff', fontSize: 10 }} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2
                style={{
                  color: '#ffffff',
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                }}
              >
                {displayName}
              </h2>
              <Tag
                color="blue"
                style={{
                  margin: 0,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  borderColor: 'rgba(255,255,255,0.4)',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: 12,
                  padding: '1px 10px',
                }}
              >
                {displayRole}
              </Tag>
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MailOutlined style={{ fontSize: 13 }} />
              <span style={{ wordBreak: 'break-all' }}>{displayEmail}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body Content - Direct Profile Form */}
      <div style={{ padding: '24px 28px 20px' }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937' }}>
            Thông tin cá nhân
          </h3>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Cập nhật họ tên, số điện thoại và email liên hệ của bạn
          </span>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
        >
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 600, color: '#262626' }}>Họ và tên</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên' },
              { min: 2, message: 'Họ và tên tối thiểu 2 ký tự' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#8c8c8c' }} />}
              placeholder="Nhập họ và tên của bạn"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label={<span style={{ fontWeight: 600, color: '#262626' }}>Số điện thoại</span>}
                rules={[
                  {
                    pattern: /^[0-9+\s-]{9,15}$/,
                    message: 'Số điện thoại không đúng định dạng',
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#8c8c8c' }} />}
                  placeholder="Ví dụ: 0901234567"
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label={<span style={{ fontWeight: 600, color: '#262626' }}>Địa chỉ Email</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không đúng định dạng' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#8c8c8c' }} />}
                  placeholder="example@gmail.com"
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider style={{ margin: '16px 0 20px' }} />

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button
            size="large"
            icon={<CloseOutlined />}
            onClick={onClose}
            disabled={isSubmitting}
            style={{ borderRadius: 8, minWidth: 90 }}
          >
            Hủy
          </Button>

          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={isSubmitting}
            onClick={handleSubmit}
            style={{
              borderRadius: 8,
              minWidth: 140,
              background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(22, 119, 255, 0.35)',
            }}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Modal>
  );
};
