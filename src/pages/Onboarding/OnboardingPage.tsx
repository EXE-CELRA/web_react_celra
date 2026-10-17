import React, { useState } from 'react';
import { Card, Steps, Form, Input, Select, Radio, Button, Typography, message, Result, Space, Row, Col } from 'antd';
import {
  BankOutlined,
  CalculatorOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '../../store/useOrgStore';

const { Title, Paragraph } = Typography;

export const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [createdOrg, setCreatedOrg] = useState<any>(null);

  const { submitOnboarding } = useOrgStore();
  const navigate = useNavigate();

  const handleNext = async () => {
    try {
      await form.validateFields();
      setCurrentStep((prev) => prev + 1);
    } catch (err) {
      console.log('Validation failed:', err);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        legalName: values.legalName,
        taxCode: values.taxCode,
        industry: values.industry,
        scale: values.scale,
        address: values.address,
        city: values.city,
        accountingRegime: values.accountingRegime,
        vatMethod: values.vatMethod,
        taxCycle: values.taxCycle,
        hasForeignDirector: values.hasForeignDirector,
        employeeCount: values.employeeCount,
        hasTradeUnion: values.hasTradeUnion,
        hasHazardousEnvironment: values.hasHazardousEnvironment,
        businessPremisesType: values.businessPremisesType,
        hasFoodPermit: values.hasFoodPermit,
        hasFireSafetyCert: values.hasFireSafetyCert,
      };

      const result = await submitOnboarding(payload);
      setCreatedOrg(result);
      setCurrentStep(4);
      message.success('Khởi tạo hồ sơ doanh nghiệp và kích hoạt hệ thống tuân thủ thành công!');
    } catch (err: any) {
      message.error(err.message || 'Lỗi khởi tạo hồ sơ doanh nghiệp');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: '30px auto', padding: '0 16px' }}>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Title level={2} style={{ margin: 0 }}>
            Khởi Tạo Hồ Sơ Tuân Thủ Doanh Nghiệp
          </Title>
          <Paragraph type="secondary" style={{ marginTop: 6 }}>
            Khai báo thông tin đặc thù của doanh nghiệp để CELRA tự động sinh lịch trình nghĩa vụ thuế, lao động và giấy phép
          </Paragraph>
        </div>

        <Steps
          current={currentStep}
          style={{ marginBottom: 36 }}
          items={[
            { title: 'Pháp Lý', icon: <BankOutlined /> },
            { title: 'Kế Toán & Thuế', icon: <CalculatorOutlined /> },
            { title: 'Lao Động', icon: <TeamOutlined /> },
            { title: 'Vận Hành & PCCC', icon: <SafetyCertificateOutlined /> },
            { title: 'Kích Hoạt', icon: <CheckCircleOutlined /> },
          ]}
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            scale: 'MICRO',
            industry: 'Dịch vụ phần mềm & Công nghệ thông tin',
            city: 'Hà Nội',
            accountingRegime: 'TT133',
            vatMethod: 'KHAU_TRU',
            taxCycle: 'QUY',
            hasForeignDirector: false,
            employeeCount: 5,
            hasTradeUnion: false,
            hasHazardousEnvironment: false,
            businessPremisesType: 'RENTAL_OFFICE',
            hasFoodPermit: false,
            hasFireSafetyCert: true,
          }}
        >
          {currentStep === 0 && (
            <div>
              <Title level={4}>1. Thông Tin Định Danh Pháp Lý</Title>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="legalName"
                    label="Tên Doanh Nghiệp (Theo Giấy ĐKKD)"
                    rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                  >
                    <Input placeholder="CÔNG TY TNHH GIẢI PHÁP CÔNG NGHỆ CELRA" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="taxCode"
                    label="Mã Số Thuế (MST)"
                    rules={[{ required: true, message: 'Vui lòng nhập mã số thuế' }]}
                  >
                    <Input placeholder="0109988776" maxLength={13} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="scale" label="Quy Mô Doanh Nghiệp">
                    <Select
                      options={[
                        { label: 'Siêu nhỏ (Dưới 10 lao động)', value: 'MICRO' },
                        { label: 'Nhỏ (10 - 50 lao động)', value: 'SMALL' },
                        { label: 'Vừa (50 - 200 lao động)', value: 'MEDIUM' },
                        { label: 'Lớn (Trên 200 lao động)', value: 'LARGE' },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="industry" label="Ngành Nghề Kinh Doanh Chính">
                    <Input placeholder="Dịch vụ CNTT, Thương mại, Sản xuất, F&B..." />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="city" label="Tỉnh / Thành Phố">
                    <Select
                      showSearch
                      options={[
                        { label: 'Hà Nội', value: 'Hà Nội' },
                        { label: 'TP. Hồ Chí Minh', value: 'TP. Hồ Chí Minh' },
                        { label: 'Đà Nẵng', value: 'Đà Nẵng' },
                        { label: 'Hải Phòng', value: 'Hải Phòng' },
                        { label: 'Cần Thơ', value: 'Cần Thơ' },
                        { label: 'Bình Dương', value: 'Bình Dương' },
                        { label: 'Khác', value: 'Khác' },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="address" label="Địa Chỉ Trụ Sở Chính">
                    <Input placeholder="Số 102 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy..." />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <Title level={4}>2. Chế Độ Kế Toán & Kê Khai Thuế</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="accountingRegime" label="Chế Độ Kế Toán Áp Dụng">
                    <Radio.Group>
                      <Space direction="vertical">
                        <Radio value="TT133">Thông tư 133/2016/TT-BTC (Doanh nghiệp vừa và nhỏ)</Radio>
                        <Radio value="TT200">Thông tư 200/2014/TT-BTC (Doanh nghiệp lớn / toàn diện)</Radio>
                        <Radio value="TT88">Thông tư 88/2021/TT-BTC (Hộ kinh doanh cá thể)</Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="vatMethod" label="Phương Pháp Kê Khai Thuế GTGT">
                    <Radio.Group>
                      <Space direction="vertical">
                        <Radio value="KHAU_TRU">Phương pháp Khấu trừ thuế</Radio>
                        <Radio value="TRUC_TIEP">Phương pháp Trực tiếp trên doanh thu</Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="taxCycle" label="Kỳ Kê Khai Thuế GTGT & TNCN">
                    <Radio.Group>
                      <Radio value="QUY">Kê khai theo Quý (Doanh thu &lt; 50 tỷ)</Radio>
                      <Radio value="THANG">Kê khai theo Tháng (Doanh thu &gt;= 50 tỷ)</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="hasForeignDirector" label="Có Người Nước Ngoài Làm Đại Diện PL / Lao Động">
                    <Radio.Group>
                      <Radio value={true}>Có (Cần thủ tục Giấy phép lao động/Thẻ tạm trú)</Radio>
                      <Radio value={false}>Không</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <Title level={4}>3. Quy Mô Nhân Sự & Nghĩa Vụ Lao Động</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="employeeCount"
                    label="Số Lượng Lao Động Có Hợp Đồng Chính Thức"
                    rules={[{ required: true, message: 'Vui lòng nhập số nhân sự' }]}
                  >
                    <Input type="number" min={0} placeholder="5" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="hasTradeUnion" label="Đã Thành Lập Công Đoàn Cơ Sở">
                    <Radio.Group>
                      <Radio value={true}>Đã thành lập</Radio>
                      <Radio value={false}>Chưa thành lập (Nộp kinh phí CĐ theo quy định)</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="hasHazardousEnvironment" label="Môi Trường Lao Động Có Yếu Tố Độc Hại / Nặng Nhọc">
                    <Radio.Group>
                      <Radio value={true}>Có (Cần khám sức khỏe nghề nghiệp định kỳ 2 lần/năm)</Radio>
                      <Radio value={false}>Không (Khám sức khỏe định kỳ tiêu chuẩn 1 lần/năm)</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <Title level={4}>4. Điều Kiện Vận Hành, Cơ Sở & PCCC</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="businessPremisesType" label="Loại Hình Địa Điểm Hoạt Động">
                    <Select
                      options={[
                        { label: 'Thuê văn phòng tòa nhà thương mại', value: 'RENTAL_OFFICE' },
                        { label: 'Nhà phố / Mặt bằng độc lập', value: 'STREET_BUILDING' },
                        { label: 'Nhà xưởng / Khu công nghiệp', value: 'FACTORY_INDUSTRIAL' },
                        { label: 'Văn phòng ảo / Coworking', value: 'VIRTUAL_OFFICE' },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="hasFireSafetyCert" label="Hồ Sơ Quản Lý & Phương Án PCCC">
                    <Radio.Group>
                      <Radio value={true}>Đã có hồ sơ phương án PCCC</Radio>
                      <Radio value={false}>Chưa lập hồ sơ PCCC cơ sở</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="hasFoodPermit" label="Ngành Nghề Thuộc Diện Cần Giấy Phép ATTP">
                    <Radio.Group>
                      <Radio value={true}>Có (Kinh doanh ăn uống, thực phẩm, đồ uống...)</Radio>
                      <Radio value={false}>Không liên quan ngành thực phẩm</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {currentStep === 4 && (
            <Result
              status="success"
              title="Khởi Tạo Doanh Nghiệp Thành Công!"
              subTitle={`Doanh nghiệp ${createdOrg?.legalName || ''} đã được thiết lập. Công cụ CELRA Rule Engine đã tự động sinh danh mục công việc, lịch trình nghĩa vụ và tạo ví bảo chứng cho bạn.`}
              extra={[
                <Button
                  type="primary"
                  key="dashboard"
                  size="large"
                  onClick={() => navigate('/dashboard')}
                >
                  Truy Cập Bảng Điều Khiển
                </Button>,
                <Button
                  key="tasks"
                  size="large"
                  onClick={() => navigate('/tasks')}
                >
                  Xem Danh Mục Nghĩa Vụ Cần Làm
                </Button>,
              ]}
            />
          )}

          {currentStep < 4 && (
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
              {currentStep > 0 ? (
                <Button onClick={handlePrev}>Quay Lại</Button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <Button type="primary" onClick={handleNext}>
                  Tiếp Tục
                </Button>
              ) : (
                <Button type="primary" onClick={handleSubmit} loading={submitting}>
                  Hoàn Tất & Khởi Tạo Hồ Sơ Tuân Thủ
                </Button>
              )}
            </div>
          )}
        </Form>
      </Card>
    </div>
  );
};
