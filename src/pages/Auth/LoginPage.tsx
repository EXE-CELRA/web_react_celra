import React from 'react';
import { Form, Input, Button, Checkbox, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthLayout } from '../../components/layout/AuthLayout';

const { Text } = Typography;

export const LoginPage: React.FC = () => {
  const { login, dangNhap, isLoading, dangTai } = useAuthStore();

  const onFinish = async (values: any) => {
    try {
      const loginMethod = dangNhap || login;
      const res = await loginMethod({
        email: values.email,
        password: values.password || values.matKhau,
        matKhau: values.password || values.matKhau,
      });

      message.success('Đăng nhập thành công!');
      const userObj = res.user || res.nguoiDung;
      if (userObj?.role === 'admin' || userObj?.vaiTro === 'admin' || userObj?.isSuperAdmin) {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      message.error(err.message || 'Email hoặc mật khẩu không chính xác');
    }
  };

  return (
    <AuthLayout
      title="Đăng Nhập"
      subtitle="Chào mừng bạn quay lại. Vui lòng đăng nhập để tiếp tục quản trị tuân thủ doanh nghiệp."
      rightButtonText="Đăng Ký Miễn Phí"
      rightButtonLink="/register"
      cardMaxWidth={460}
    >
      <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13.5 }}>Email</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập email của bạn' },
            { type: 'email', message: 'Email không đúng định dạng' },
          ]}
          style={{ marginBottom: 18 }}
        >
          <Input
            prefix={<MailOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
            placeholder="Nhập email của bạn"
            style={{ height: 44, borderRadius: 8 }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13.5 }}>Mật khẩu</span>}
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          style={{ marginBottom: 14 }}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 6 }} />}
            placeholder="Nhập mật khẩu"
            style={{ height: 44, borderRadius: 8 }}
          />
        </Form.Item>

        {/* Ghi nhớ đăng nhập & Quên mật khẩu */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            fontSize: 13,
          }}
        >
          <Form.Item name="remember" valuePropName="checked" noStyle initialValue={true}>
            <Checkbox style={{ color: '#475569', fontSize: 13 }}>Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>
          <Link
            to="/forgot-password"
            style={{ color: '#0052cc', fontWeight: 500, fontSize: 13 }}
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Nút đăng nhập */}
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading || dangTai}
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
          Đăng Nhập
        </Button>

        {/* Link chuyển hướng Đăng ký */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5 }}>
          <Text style={{ color: '#64748b' }}>Chưa có tài khoản? </Text>
          <Link to="/register" style={{ color: '#0052cc', fontWeight: 600 }}>
            Đăng ký miễn phí
          </Link>
        </div>
      </Form>
    </AuthLayout>
  );
};
