import type { ProfileModalProps } from '../../interfaces';
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Avatar,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  SaveOutlined,
  CloseOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  CrownOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrgStore } from '../../store/useOrgStore';



export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updateProfile } = useAuthStore();
  const { activeOrg } = useOrgStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const displayName = user?.name || user?.fullName || 'Chủ doanh nghiệp';
  const displayEmail = user?.email || '';
  const displayPhone = user?.phone || user?.phoneNumber || '';
  const displayRole = user?.roleTitle || user?.role || user?.systemRole || 'Chủ doanh nghiệp';
  const orgName = activeOrg?.legalName || activeOrg?.name || 'Doanh nghiệp CELRA';
  const taxCode = activeOrg?.taxCode || '';

  // Sync form values and avatar when modal opens or user updates
  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        name: displayName,
        email: displayEmail,
        phone: displayPhone,
      });
      setAvatarPreview(user?.avatar || null);
    }
  }, [open, user, displayName, displayEmail, displayPhone, form]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error('Kích thước ảnh tối đa là 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Tối ưu ảnh avatar thành hình vuông 256x256 sắc nét, dung lượng nhẹ
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarPreview(optimizedDataUrl);
          message.success('Đã tải ảnh lên bản xem trước. Bấm "Lưu thay đổi" để áp dụng!');
        } else {
          setAvatarPreview(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      await updateProfile({
        name: values.name.trim(),
        phone: values.phone ? values.phone.trim() : '',
        email: values.email.trim(),
        avatar: avatarPreview || undefined,
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
      closable={false}
      width={600}
      centered
      destroyOnClose
      styles={{
        body: {
          padding: 0,
          borderRadius: 16,
          overflow: 'hidden',
        },
      }}
    >
      {/* 1. BANNER HEADER DOANH NGHIỆP CAO CẤP */}
      <div
        style={{
          background: 'linear-gradient(135deg, #071e3d 0%, #0d2b59 55%, #1677ff 100%)',
          padding: '28px 28px 24px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow ambient circle trang trí */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        {/* Nút đóng X tùy biến sang trọng */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Đóng"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <CloseOutlined style={{ fontSize: 13 }} />
        </button>

        {/* Input ẩn để tải ảnh đại diện */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />

        {/* Cụm thông tin Avatar và Định danh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
            title="Bấm để tải ảnh đại diện mới"
          >
            <Avatar
              size={76}
              src={avatarPreview || user?.avatar}
              icon={!avatarPreview && !user?.avatar && <UserOutlined />}
              style={{
                backgroundColor: '#ffffff',
                color: '#0d2b59',
                fontSize: 32,
                fontWeight: 700,
                boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                border: '3px solid rgba(255, 255, 255, 0.9)',
              }}
            >
              {!avatarPreview && !user?.avatar && (displayName ? displayName.charAt(0).toUpperCase() : 'U')}
            </Avatar>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#2563eb',
                borderRadius: '50%',
                width: 26,
                height: 26,
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              title="Tải ảnh đại diện mới"
            >
              <CameraOutlined style={{ fontSize: 13 }} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2
                style={{
                  color: '#ffffff',
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: -0.3,
                  lineHeight: 1.2,
                }}
              >
                {displayName}
              </h2>
              <Tag
                style={{
                  margin: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: 20,
                  padding: '2px 10px',
                  fontSize: 11.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CrownOutlined style={{ color: '#ffd666', fontSize: 12 }} />
                {displayRole}
              </Tag>
            </div>

            {/* Thông tin Doanh nghiệp quản lý */}
            <div
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: 13,
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={`${orgName} ${taxCode ? `(MST: ${taxCode})` : ''}`}
            >
              <BankOutlined style={{ color: '#93c5fd', fontSize: 13, flexShrink: 0 }} />
              <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {orgName}
              </span>
              {taxCode && (
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11.5 }}>
                  • MST: {taxCode}
                </span>
              )}
            </div>

            {/* Email hiển thị ngắn gọn */}
            <div
              style={{
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: 12,
                marginTop: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MailOutlined style={{ fontSize: 12, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayEmail}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BODY CONTENT - FORM CẬP NHẬT CHUYÊN NGHIỆP */}
      <div style={{ padding: '24px 28px 24px' }}>
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: '#0f172a' }}>
            Thông tin cá nhân & Tài khoản
          </h3>
          <span style={{ fontSize: 12.5, color: '#64748b' }}>
            Cập nhật thông tin định danh và phương thức liên hệ chính thức của chủ doanh nghiệp
          </span>
        </div>

        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label={
                  <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>
                    Họ và tên chủ tài khoản
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên' },
                  { min: 2, message: 'Họ và tên tối thiểu 2 ký tự' },
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Nhập họ và tên"
                  size="large"
                  style={{ borderRadius: 10, borderColor: '#cbd5e1' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label={
                  <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>
                    Số điện thoại liên hệ
                  </span>
                }
                rules={[
                  {
                    pattern: /^[0-9+\s-]{9,15}$/,
                    message: 'Số điện thoại không đúng định dạng',
                  },
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Ví dụ: 0901234567"
                  size="large"
                  style={{ borderRadius: 10, borderColor: '#cbd5e1' }}
                />
              </Form.Item>
            </Col>

            {/* Email chiếm trọn 100% dòng ngang để KHÔNG BAO GIỜ bị cắt chữ (overflow) */}
            <Col xs={24}>
              <Form.Item
                name="email"
                label={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>
                      Địa chỉ Email đăng nhập & Nhận thông báo
                    </span>
                    <span style={{ fontSize: 11, color: '#0ea5e9', fontWeight: 500 }}>
                      Kênh nhận cảnh báo luật
                    </span>
                  </div>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không đúng định dạng' },
                ]}
                style={{ marginBottom: 18 }}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="name@company.com"
                  size="large"
                  style={{ borderRadius: 10, borderColor: '#cbd5e1' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {/* 3. THẺ TRẠNG THÁI BẢO MẬT & HỆ THỐNG (SYSTEM SECURITY BADGE) */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
                flexShrink: 0,
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                Tài khoản Doanh nghiệp Độc lập
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Được cấp quyền ký xác nhận hoàn thành nghĩa vụ & lưu hồ sơ thanh tra
              </div>
            </div>
          </div>
          <Tag color="cyan" style={{ margin: 0, fontWeight: 600, fontSize: 11, borderRadius: 6 }}>
            Bảo mật 256-bit
          </Tag>
        </div>

        {/* 4. FOOTER ACTION BUTTONS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button
            size="large"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              borderRadius: 10,
              minWidth: 100,
              fontWeight: 600,
              color: '#475569',
              borderColor: '#cbd5e1',
            }}
          >
            Hủy bỏ
          </Button>

          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={isSubmitting}
            onClick={handleSubmit}
            style={{
              borderRadius: 10,
              minWidth: 150,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #1677ff 0%, #0d2b59 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
            }}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Modal>
  );
};
