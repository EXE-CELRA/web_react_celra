import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text, Paragraph } = Typography;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);

  const onFinish = async (values: any) => {
    try {
      const res = await login({
        email: values.email,
        password: values.password,
        twoFactorCode: values.twoFactorCode,
      });

      if (res.twoFactorRequired) {
        setTwoFactorRequired(true);
        message.info('Tài khoản đã bật bảo mật 2 lớp (2FA). Vui lòng nhập mã OTP từ Google Authenticator.');
        return;
      }

      message.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err: any) {
      message.error(err.message || 'Email hoặc mật khẩu không chính xác');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f2f5',
        backgroundImage: 'radial-gradient(#e6f4ff 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 24,
              marginBottom: 12,
            }}
          >
            C
          </div>
          <Title level={3} style={{ margin: 0 }}>
            CELRA Compliance
          </Title>
          <Paragraph type="secondary" style={{ marginTop: 4 }}>
            Nền Tảng Điều Phối Tuân Thủ & Nghĩa Vụ Doanh Nghiệp
          </Paragraph>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            label="Email Doanh Nghiệp"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không đúng định dạng' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="ceo@company.vn" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          {twoFactorRequired && (
            <Form.Item
              name="twoFactorCode"
              label="Mã xác thực 2 bước (2FA OTP)"
              rules={[{ required: true, message: 'Vui lòng nhập mã 6 số từ Google Authenticator' }]}
            >
              <Input prefix={<SafetyCertificateOutlined />} placeholder="123456" maxLength={6} />
            </Form.Item>
          )}

          <Button type="primary" htmlType="submit" loading={isLoading} block style={{ height: 44, marginTop: 8 }}>
            Đăng Nhập
          </Button>

          <Divider style={{ margin: '20px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Chưa có tài khoản doanh nghiệp? </Text>
            <Link to="/register">Đăng ký ngay</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};
