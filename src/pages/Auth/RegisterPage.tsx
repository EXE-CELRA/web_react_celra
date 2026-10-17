import React from 'react';
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Text, Paragraph } = Typography;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const onFinish = async (values: any) => {
    try {
      await register({
        name: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phoneNumber,
      });

      message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: any) {
      message.error(err.message || 'Đăng ký không thành công');
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
          maxWidth: 460,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
            Tạo Tài Khoản CELRA
          </Title>
          <Paragraph type="secondary" style={{ marginTop: 4 }}>
            Bắt đầu quản trị nghĩa vụ pháp lý & tuân thủ của doanh nghiệp
          </Paragraph>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email công việc"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="nguyenvana@company.vn" />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="0901234567" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={isLoading} block style={{ height: 44, marginTop: 8 }}>
            Tạo Tài Khoản
          </Button>

          <Divider style={{ margin: '20px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Đã có tài khoản? </Text>
            <Link to="/login">Đăng nhập</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};
