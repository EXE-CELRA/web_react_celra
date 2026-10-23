import React, { useState } from 'react';
import { Form, Input, Button, message, Modal } from 'antd';
import { MailOutlined, ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import apiClient from '../../api/client';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');

  // State Modal 1: Nhập mã OTP
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  // State Modal 2: Đặt lại mật khẩu mới
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Gửi OTP khôi phục mật khẩu
  const onSendOtp = async (values: { email: string }) => {
    setLoading(true);
    try {
      message.loading({
        content: 'Đang gửi mã OTP khôi phục mật khẩu...',
        key: 'forgot_otp_loading',
      });
      await apiClient.post('/auth/forgot-password/send-otp', {
        email: values.email,
      });
      setTargetEmail(values.email);
      message.success({
        content: 'Mã xác thực OTP đã được gửi về email của bạn!',
        key: 'forgot_otp_loading',
      });
      setOtpCode('');
      setIsOtpModalOpen(true);
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        (typeof err === 'string' ? err : 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
      message.error({
        content: errorMsg,
        key: 'forgot_otp_loading',
      });
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (!targetEmail) return;
    setIsResendingOtp(true);
    try {
      message.loading({
        content: 'Đang gửi lại mã OTP...',
        key: 'resend_otp_loading',
      });
      await apiClient.post('/auth/forgot-password/send-otp', {
        email: targetEmail,
      });
      message.success({
        content: 'Mã OTP mới đã được gửi về email!',
        key: 'resend_otp_loading',
      });
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        (typeof err === 'string' ? err : 'Không thể gửi lại mã OTP.');
      message.error({
        content: errorMsg,
        key: 'resend_otp_loading',
      });
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Xác nhận OTP (Modal 1)
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      message.warning('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await apiClient.post('/auth/forgot-password/verify-otp', {
        email: targetEmail,
        otp: otpCode,
      });
      message.success('Xác thực OTP thành công! Vui lòng tạo mật khẩu mới.');
      setIsOtpModalOpen(false);
      resetForm.resetFields();
      setIsResetModalOpen(true);
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        (typeof err === 'string' ? err : 'Mã OTP không đúng hoặc đã hết hạn');
      message.error(errorMsg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Đặt lại mật khẩu mới (Modal 2)
  const handleResetPassword = async () => {
    try {
      const values = await resetForm.validateFields();
      setIsSubmittingReset(true);
      await apiClient.post('/auth/forgot-password/reset', {
        email: targetEmail,
        otp: otpCode,
        newPassword: values.newPassword,
      });
      message.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
      setIsResetModalOpen(false);
      navigate('/login');
    } catch (err: any) {
      if (err?.errorFields) return; // Lỗi validate form ant design
      const errorMsg =
        err?.message ||
        (typeof err === 'string' ? err : 'Không thể đặt lại mật khẩu');
      message.error(errorMsg);
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <AuthLayout
      title="Quên Mật Khẩu"
      subtitle="Nhập email doanh nghiệp đã đăng ký của bạn để nhận mã OTP khôi phục mật khẩu."
      rightButtonText="Đăng Nhập"
      rightButtonLink="/login"
      cardMaxWidth={460}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSendOtp}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13.5 }}>Email Doanh Nghiệp</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập email doanh nghiệp của bạn' },
            {
              pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: 'Email không đúng định dạng chuẩn (VD: ceo@gmail.com)',
            },
          ]}
          style={{ marginBottom: 24 }}
        >
          <Input
            prefix={<MailOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
            placeholder="ceo@company.vn"
            style={{ height: 44, borderRadius: 8 }}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          style={{
            height: 46,
            borderRadius: 8,
            backgroundColor: '#0052cc',
            borderColor: '#0052cc',
            fontSize: 15,
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(0, 82, 204, 0.3)',
          }}
        >
          Gửi OTP
        </Button>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5 }}>
          <Link to="/login" style={{ color: '#0052cc', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeftOutlined /> Quay lại đăng nhập
          </Link>
        </div>
      </Form>

      {/* MODAL 1: NHẬP MÃ OTP */}
      <Modal
        title={
          <span style={{ color: '#0052cc', fontWeight: 700 }}>
            Xác Thực Mã OTP Email
          </span>
        }
        open={isOtpModalOpen}
        onCancel={() => setIsOtpModalOpen(false)}
        onOk={handleVerifyOtp}
        confirmLoading={isVerifyingOtp}
        okText="Xác Nhận OTP"
        cancelText="Hủy"
        centered
      >
        <p style={{ color: '#475569', fontSize: 14 }}>
          Chúng tôi đã gửi một mã xác thực 6 chữ số đến email <strong>{targetEmail}</strong>. Vui lòng kiểm tra hộp thư (hoặc mục Spam).
        </p>
        <Input
          maxLength={6}
          placeholder="Nhập OTP của bạn"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.trim())}
          style={{
            height: 48,
            fontSize: 20,
            letterSpacing: 2,
            textAlign: 'center',
            fontWeight: 'bold',
            borderRadius: 8,
            borderColor: '#0052cc',
            marginTop: 10,
          }}
        />
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <Button
            type="link"
            size="small"
            loading={isResendingOtp}
            onClick={handleResendOtp}
            style={{ padding: 0 }}
          >
          Gửi lại OTP
          </Button>
        </div>
      </Modal>

      {/* MODAL 2: TẠO MẬT KHẨU MỚI */}
      <Modal
        title={
          <span style={{ color: '#0052cc', fontWeight: 700 }}>
            Đặt Lại Mật Khẩu Mới
          </span>
        }
        open={isResetModalOpen}
        onCancel={() => setIsResetModalOpen(false)}
        onOk={handleResetPassword}
        confirmLoading={isSubmittingReset}
        okText="Cập Nhật Mật Khẩu"
        cancelText="Hủy"
        centered
      >
        <p style={{ color: '#475569', fontSize: 13.5, marginBottom: 16 }}>
          Vui lòng thiết lập mật khẩu mới an toàn cho tài khoản <strong>{targetEmail}</strong>.
        </p>
        <Form
          form={resetForm}
          layout="vertical"
          requiredMark={false}
          size="middle"
        >
          <Form.Item
            name="newPassword"
            label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>Mật khẩu mới</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                message: 'Mật khẩu tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
              },
            ]}
            style={{ marginBottom: 14 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
              placeholder="••••••••"
              style={{ height: 42, borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>Xác nhận mật khẩu mới</span>}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
            style={{ marginBottom: 8 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
              placeholder="••••••••"
              style={{ height: 42, borderRadius: 8 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </AuthLayout>
  );
};
