import React from 'react';
import { Form, Input, Button, Typography, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthLayout } from '../../components/layout/AuthLayout';

const { Text } = Typography;

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
    <AuthLayout
      title="Đăng Ký Tài Khoản"
      subtitle="Khởi tạo tài khoản doanh nghiệp để bắt đầu kiểm soát nghĩa vụ thuế và pháp lý."
      rightButtonText="Đăng Nhập"
      rightButtonLink="/login"
      cardMaxWidth={540}
    >
      <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
        <Row gutter={[14, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="fullName"
              label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>Họ và tên</span>}
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên của bạn' }]}
              style={{ marginBottom: 12 }}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                placeholder="Nhập họ và tên của bạn"
                style={{ height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="phoneNumber"
              label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>Số điện thoại</span>}
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại liên hệ' }]}
              style={{ marginBottom: 12 }}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                placeholder="0901234567"
                style={{ height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[14, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>Email công việc</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập email công việc' },
                { type: 'email', message: 'Email không đúng định dạng' },
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                placeholder="ceo@company.vn"
                style={{ height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>Mật khẩu</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
                placeholder="••••••••"
                style={{ height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          block
          style={{
            height: 42,
            borderRadius: 8,
            backgroundColor: '#0052cc',
            borderColor: '#0052cc',
            fontSize: 15,
            fontWeight: 600,
            marginTop: 4,
            boxShadow: '0 4px 14px rgba(0, 82, 204, 0.3)',
          }}
        >
          Tạo Tài Khoản
        </Button>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
          <Text style={{ color: '#64748b' }}>Đã có tài khoản doanh nghiệp? </Text>
          <Link to="/login" style={{ color: '#0052cc', fontWeight: 600 }}>
            Đăng nhập ngay
          </Link>
        </div>
      </Form>
    </AuthLayout>
  );
};
