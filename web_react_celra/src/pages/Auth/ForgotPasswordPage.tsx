import React, { useState } from 'react';
import { Form, Input, Button, message, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Giả lập gửi yêu cầu khôi phục mật khẩu
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmittedEmail(values.email);
      setIsSubmitted(true);
      message.success('Yêu cầu khôi phục mật khẩu đã được tiếp nhận!');
    } catch (err: any) {
      message.error('Không thể gửi yêu cầu khôi phục. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Quên Mật Khẩu"
      subtitle="Nhập email doanh nghiệp đã đăng ký của bạn để nhận liên kết khôi phục mật khẩu."
      rightButtonText="Đăng Nhập"
      rightButtonLink="/login"
      cardMaxWidth={460}
    >
      {isSubmitted ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <Result
            status="success"
            title="Đã gửi email khôi phục!"
            subTitle={
              <span>
                CELRA đã gửi đường dẫn đặt lại mật khẩu đến <strong>{submittedEmail}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam).
              </span>
            }
            extra={[
              <Button
                type="primary"
                key="login"
                href="/login"
                style={{
                  height: 44,
                  padding: '0 28px',
                  borderRadius: 8,
                  backgroundColor: '#0052cc',
                  fontWeight: 600,
                }}
              >
                Quay lại Đăng Nhập
              </Button>,
            ]}
          />
        </div>
      ) : (
        <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 600, color: '#334155', fontSize: 13.5 }}>Email Doanh Nghiệp</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập email của bạn' },
              { type: 'email', message: 'Email không đúng định dạng' },
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
            Gửi Yêu Cầu Khôi Phục
          </Button>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5 }}>
            <Link to="/login" style={{ color: '#0052cc', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeftOutlined /> Quay lại đăng nhập
            </Link>
          </div>
        </Form>
      )}
    </AuthLayout>
  );
};
