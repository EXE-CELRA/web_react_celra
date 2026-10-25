import React from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  message,
  Row,
  Col,
  Modal,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { AuthLayout } from "../../components/layout/AuthLayout";
import apiClient from "../../api/client";

const { Text } = Typography;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, dangKy, isLoading, dangTai } = useAuthStore();
  const [formValues, setFormValues] = React.useState<any>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [isSubmittingOtp, setIsSubmittingOtp] = React.useState(false);
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const onFinish = async (values: any) => {
    try {
      setIsSendingOtp(true);
      setFormValues(values);
      setOtpCode("");
      message.loading({
        content: "Đang gửi mã OTP đến email của bạn...",
        key: "otp_loading",
      });
      const res: any = await apiClient.post("/auth/send-otp", {
        email: values.email,
        name: values.fullName,
      });

      if (res?.debugOtp) {
        setOtpCode(res.debugOtp);
        message.success({
          content: `[Thử nghiệm] Mã OTP tự động: ${res.debugOtp}`,
          key: "otp_loading",
          duration: 6,
        });
      } else {
        message.success({
          content: "Mã OTP đã được gửi về email! Vui lòng kiểm tra hộp thư.",
          key: "otp_loading",
        });
      }
      setIsOtpModalOpen(true);
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        (typeof err === "string" ? err : "Không thể gửi mã OTP, vui lòng thử lại sau");
      message.error({
        content: errorMsg,
        key: "otp_loading",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };
  const handleConfirmOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      message.warning("Vui lòng nhập đủ 6 chữ số mã OTP");
      return;
    }

    try {
      setIsSubmittingOtp(true);
      const registerMethod = dangKy || register;
      await registerMethod({
        name: formValues.fullName,
        hoVaTen: formValues.fullName,
        email: formValues.email,
        password: formValues.password,
        matKhau: formValues.password,
        phone: formValues.phoneNumber,
        soDienThoai: formValues.phoneNumber,
        otp: otpCode,
      });

      message.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
      setIsOtpModalOpen(false);
      navigate("/login");
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        (typeof err === "string" ? err : "Mã OTP không đúng hoặc đã hết hạn");
      message.error(errorMsg);
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng Ký"
      subtitle="Khởi tạo tài khoản doanh nghiệp để bắt đầu kiểm soát tuân thủ pháp lý."
      rightButtonText="Đăng Nhập"
      rightButtonLink="/login"
      cardMaxWidth={540}
    >
      <Form
        layout="vertical"
        onFinish={onFinish}
        size="large"
        requiredMark={false}
      >
        <Row gutter={[14, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="fullName"
              label={
                <span
                  style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}
                >
                  Họ và tên
                </span>
              }
              rules={[
                { required: true, message: "Vui lòng nhập họ và tên của bạn" },
                {
                  pattern: /^[\p{L}\s]{2,50}$/u,
                  message:
                    "Họ và tên phải từ 2 đến 50 ký tự và không chứa số, ký tự đặc biệt",
                },
              ]}
              style={{ marginBottom: 12 }}
            >
              <Input
                prefix={
                  <UserOutlined style={{ color: "#94a3b8", marginRight: 6 }} />
                }
                placeholder="họ và tên"
                style={{ height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="phoneNumber"
              label={
                <span
                  style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}
                >
                  Số điện thoại
                </span>
              }
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số điện thoại liên hệ",
                },
                {
                  pattern: /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/,
                  message:
                    "Số điện thoại không đúng chuẩn Việt Nam (VD: 0912345678 hoặc +84912345678)",
                },
              ]}
              style={{ marginBottom: 12 }}
            >
              <Input
                prefix={
                  <PhoneOutlined style={{ color: "#94a3b8", marginRight: 6 }} />
                }
                placeholder="số điện thoại"
                style={{ height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[14, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label={
                <span
                  style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}
                >
                  Email công việc
                </span>
              }
              rules={[
                { required: true, message: "Vui lòng nhập email công việc" },
                {
                  pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message:
                    "Email không đúng định dạng chuẩn (VD: ceo@gmail.com)",
                },
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input
                prefix={
                  <MailOutlined style={{ color: "#94a3b8", marginRight: 6 }} />
                }
                placeholder="ceo@gmail.com"
                style={{ height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="password"
              label={
                <span
                  style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}
                >
                  Mật khẩu
                </span>
              }
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                {
                  pattern:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                  message:
                    "Mật khẩu tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt",
                },
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password
                prefix={
                  <LockOutlined style={{ color: "#94a3b8", marginRight: 6 }} />
                }
                placeholder="••••••••"
                style={{ height: 40, borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading || dangTai || isSendingOtp}
          block
          style={{
            height: 42,
            borderRadius: 8,
            backgroundColor: "#0052cc",
            borderColor: "#0052cc",
            fontSize: 15,
            fontWeight: 600,
            marginTop: 4,
            boxShadow: "0 4px 14px rgba(0, 82, 204, 0.3)",
          }}
        >
          Tạo Tài Khoản
        </Button>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 13 }}>
          <Text style={{ color: "#64748b" }}>
            Đã có tài khoản doanh nghiệp?{" "}
          </Text>
          <Link to="/login" style={{ color: "#0052cc", fontWeight: 600 }}>
            Đăng nhập ngay
          </Link>
        </div>
      </Form>
      <Modal
        title={
          <span style={{ color: "#0052cc", fontWeight: 700 }}>
            Xác Thực Mã OTP Email
          </span>
        }
        open={isOtpModalOpen}
        onCancel={() => setIsOtpModalOpen(false)}
        onOk={handleConfirmOtp}
        confirmLoading={isSubmittingOtp}
        okText="Xác Nhận & Đăng Ký"
        cancelText="Hủy"
        centered
      >
        <p style={{ color: "#475569", fontSize: 14 }}>
          Mã xác thực 6 chữ số đã được gửi đến email{" "}
          <strong style={{ color: "#0052cc" }}>{formValues?.email}</strong>. Vui lòng mở Gmail (hoặc
          kiểm tra mục Spam), sao chép mã và nhập vào bên dưới để hoàn tất đăng ký.
        </p>
        <p style={{ color: "#64748b", fontSize: 12, marginTop: -4 }}>
          💡 <em>Mẹo thử nghiệm: Bạn cũng có thể dùng mã master <strong>123456</strong> để đăng ký nhanh trong môi trường phát triển.</em>
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
            textAlign: "center",
            fontWeight: "bold",
            borderRadius: 8,
            borderColor: "#0052cc",
            marginTop: 10,
          }}
        />
        <div style={{ textAlign: "right", marginTop: 8 }}>
          <Button
            type="link"
            size="small"
            loading={isSendingOtp}
            onClick={() => onFinish(formValues)}
            style={{ padding: 0 }}
          >
         Gửi lại OTP
          </Button>
        </div>
      </Modal>
    </AuthLayout>
  );
};
