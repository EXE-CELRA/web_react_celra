import type { MandatoryOnboardingModalProps } from '../../interfaces';
import React, { useState } from 'react';
import {
  Modal,
  Steps,
  Form,
  Input,
  Select,
  Radio,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Alert,
  Divider,
  Card,
  message,
} from 'antd';
import {
  BankOutlined,
  FormOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import apiClient from '../../api/client';
import { useOrgStore } from '../../store/useOrgStore';
import celraLogo from '../../assets/logo_celra_tachnen.png';

const { Title, Paragraph, Text } = Typography;



export const MandatoryOnboardingModal: React.FC<MandatoryOnboardingModalProps> = ({ open, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [step1Data, setStep1Data] = useState<any>({});
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [isLookingUpTax, setIsLookingUpTax] = useState(false);
  const { submitOnboarding } = useOrgStore();

  const handleLookupTax = async () => {
    const taxCode = form.getFieldValue('taxCode');
    const clean = (taxCode || '').trim();
    if (!clean) {
      message.warning('Vui lòng nhập Mã số thuế trước khi tra cứu');
      return;
    }
    if (clean.length < 10) {
      message.warning('Mã số thuế doanh nghiệp phải có từ 10 đến 13 chữ số');
      return;
    }

    try {
      setIsLookingUpTax(true);
      let res: any;

      try {
        // Ưu tiên 1: Tra cứu qua máy chủ Backend CELRA nội bộ
        res = await apiClient.get(`/tax-lookup/${encodeURIComponent(clean)}`);
      } catch (backendErr) {
        // Ưu tiên 2: Tự động Fallback gọi trực tiếp Cổng VietQR nếu backend offline
        try {
          const directResp = await fetch(`https://api.vietqr.io/v2/business/${encodeURIComponent(clean)}`);
          const json = await directResp.json();
          if (json && (json.code === '00' || json.data) && json.data?.name) {
            res = {
              taxCode: json.data?.id || clean,
              name: json.data?.name,
              address: json.data?.address || '',
              shortName: json.data?.shortName || '',
              internationalName: json.data?.internationalName || '',
              status: json.data?.status || 'NNT đang hoạt động',
              isOperating: true,
            };
          } else {
            throw backendErr;
          }
        } catch {
          throw backendErr;
        }
      }
      if (res && res.name) {
        form.setFieldsValue({
          name: res.name,
          shortName: res.shortName || form.getFieldValue('shortName'),
          address: res.address || form.getFieldValue('address'),
        });
        message.success(`Đã tự động nhận diện: ${res.name}`);
      }
    } catch (err: any) {
      const errMsg = err?.message || err?.error || 'Không tìm thấy dữ liệu hoặc mã số thuế không hợp lệ.';
      message.error(errMsg);
    } finally {
      setIsLookingUpTax(false);
    }
  };

  const handleNext = async () => {
    try {
      const values = await form.validateFields([
        'name',
        'shortName',
        'taxCode',
        'legalType',
        'registrantRole',
        'city',
        'industry',
        'employeeCount',
        'operatingStatus',
        'address',
      ]);
      setStep1Data(values);
      setCurrentStep(1);
    } catch (err) {
      message.error('Vui lòng điền đầy đủ các thông tin bắt buộc của Bước 1');
    }
  };

  const handlePrev = () => {
    setCurrentStep(0);
  };

  const handleSubmit = async () => {
    try {
      const step2Values = await form.validateFields();
      setSubmitting(true);

      const allValues = {
        ...step1Data,
        ...step2Values,
        ...form.getFieldsValue(true),
      };

      const payload = {
        name: allValues.name,
        legalName: allValues.name,
        shortName: allValues.shortName || allValues.name,
        taxCode: allValues.taxCode,
        legalType: allValues.legalType || 'Công ty TNHH',
        registrantRole: allValues.registrantRole || 'Giám đốc/Người đại diện',
        city: allValues.city || 'TP. Hồ Chí Minh',
        industry: allValues.industry || 'Dịch vụ ăn uống',
        employeeCount: Number(allValues.employeeCount) || 5,
        operatingStatus: allValues.operatingStatus || 'Đang hoạt động bình thường',
        businessModel: allValues.businessModel || 'Trực tiếp tại cơ sở và trực tuyến',
        operatingYears: allValues.operatingStatus === 'Mới thành lập' ? 'Dưới 1 năm' : '1 - 3 năm',
        revenueStatus: 'Đã phát sinh doanh thu',
        address: allValues.address || allValues.city,
        representativeName: allValues.name,
        // Step 2 checklist context attributes
        accountingRegime: allValues.accountingRegime || 'TT133',
        vatMethod: allValues.vatMethod || 'KHAU_TRU',
        taxCycle: allValues.taxCycle || 'QUY',
        hasLaborContractAndInsurance: allValues.hasLaborContractAndInsurance || 'DA_DONG_DU',
        hasElectronicInvoice: allValues.hasElectronicInvoice !== undefined ? allValues.hasElectronicInvoice : true,
        hasFireSafetyCert: allValues.hasFireSafetyCert !== undefined ? allValues.hasFireSafetyCert : true,
        hasSectoralPermit: allValues.hasSectoralPermit !== undefined ? allValues.hasSectoralPermit : true,
        hasTrademarkRegistered: allValues.hasTrademarkRegistered !== undefined ? allValues.hasTrademarkRegistered : false,
      };

      await submitOnboarding(payload);
      message.success('Thiết lập hồ sơ doanh nghiệp & kích hoạt hệ thống thành công!');
      onSuccess();
    } catch (err: any) {
      message.error(err.message || 'Lỗi thiết lập hồ sơ doanh nghiệp');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      width={900}
      style={{ top: 20 }}
      styles={{
        body: {
          padding: '12px 16px',
        },
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 14 }}>
        <img
          src={celraLogo}
          alt="CELRA Logo"
          style={{ width: 56, height: 56, objectFit: 'contain' }}
        />
        <div style={{ textAlign: 'left' }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: '#072448',
              letterSpacing: 1.5,
              lineHeight: 1.1,
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            CELRA
          </div>
          <div style={{ fontSize: 10.5, color: '#475569', fontWeight: 500, marginTop: 3 }}>
            Compliance Evaluation, Legal Recovery & Assistance
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
          Kích Hoạt Hồ Sơ Doanh Nghiệp (Bắt Buộc)
        </Title>
        <Paragraph type="secondary" style={{ marginTop: 4, fontSize: 13 }}>
          Hệ thống CELRA yêu cầu thiết lập hồ sơ và dữ liệu bối cảnh ban đầu để AI & Rule Engine tự động hóa danh mục
          nghĩa vụ tuân thủ cho doanh nghiệp của bạn.
        </Paragraph>
      </div>

      <Steps
        current={currentStep}
        style={{ marginBottom: 24 }}
        items={[
          {
            title: 'Bước 1: Hồ Sơ Doanh Nghiệp Tối Thiểu',
            icon: <BankOutlined />,
            description: 'Thông tin định danh & pháp nhân',
          },
          {
            title: 'Bước 2: Checklist Khảo Sát Bối Cảnh',
            icon: <FormOutlined />,
            description: 'Thu thập bối cảnh thuế, lao động, PCCC',
          },
        ]}
      />

      <Form
        form={form}
        layout="vertical"
        preserve={true}
        initialValues={{
          legalType: 'Công ty TNHH (1 thành viên)',
          registrantRole: 'Giám đốc/Người đại diện',
          city: 'TP. Hồ Chí Minh',
          industry: 'Dịch vụ nhà hàng và ăn uống lưu động',
          employeeCount: 5,
          operatingStatus: 'Đang hoạt động bình thường',
          accountingRegime: 'TT133',
          vatMethod: 'KHAU_TRU',
          taxCycle: 'QUY',
          hasLaborContractAndInsurance: 'DA_DONG_DU',
          hasElectronicInvoice: true,
          hasFireSafetyCert: true,
          hasSectoralPermit: true,
          hasTrademarkRegistered: true,
        }}
      >
        {/* ================= STEP 1 ================= */}
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          <Alert
            message="Yêu cầu thông tin doanh nghiệp tối thiểu"
            description="Các thông tin này dùng để xác lập mã số thuế, đại diện pháp lý và phân bổ vai trò thành viên."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="name"
                label={
                  <span>
                    Tên doanh nghiệp <Text type="danger">(* Bắt buộc)</Text>
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng nhập tên doanh nghiệp' }]}
              >
                <Input placeholder="Ví dụ: CÔNG TY TNHH BẾP VIỆT SÀI GÒN" size="large" />
              </Form.Item>
            </Col>

            <Col span={10}>
              <Form.Item name="shortName" label="Tên viết tắt / Tên hiển thị">
                <Input placeholder="Ví dụ: Bếp Việt" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="taxCode"
                label={
                  <span>
                    Mã số doanh nghiệp / Mã số thuế <Text type="danger">(* Bắt buộc)</Text>
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập mã số thuế' },
                  { pattern: /^[0-9-]{10,14}$/, message: 'Mã số thuế gồm 10 đến 13 chữ số' },
                ]}
              >
                <Input
                  placeholder="Ví dụ: 0101248141"
                  size="large"
                  addonAfter={
                    <Button
                      type="link"
                      size="small"
                      icon={<SearchOutlined />}
                      loading={isLookingUpTax}
                      onClick={handleLookupTax}
                      style={{ padding: '0 4px', height: 'auto', fontWeight: 600, color: '#0d9488' }}
                    >
                      Tra cứu tự động
                    </Button>
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="legalType"
                label={
                  <span>
                    Loại hình doanh nghiệp <Text type="danger">(* Bắt buộc)</Text>
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng chọn loại hình doanh nghiệp' }]}
              >
                <Select
                  size="large"
                  options={[
                    { label: 'Công ty TNHH (1 thành viên)', value: 'Công ty TNHH (1 thành viên)' },
                    { label: 'Công ty TNHH (2 thành viên trở lên)', value: 'Công ty TNHH (2 thành viên trở lên)' },
                    { label: 'Công ty Cổ phần (JSC)', value: 'Công ty Cổ phần' },
                    { label: 'Doanh nghiệp tư nhân', value: 'Doanh nghiệp tư nhân' },
                    { label: 'Hộ kinh doanh cá thể', value: 'Hộ kinh doanh cá thể' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="registrantRole"
                label={
                  <span>
                    Vai trò của người đăng ký <Text type="danger">(* Bắt buộc)</Text>
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng chọn vai trò của bạn' }]}
              >
                <Select
                  size="large"
                  options={[
                    { label: 'Giám đốc / Tổng giám đốc', value: 'Giám đốc/Người đại diện' },
                    { label: 'Chủ sở hữu / Thành viên góp vốn', value: 'Chủ sở hữu' },
                    { label: 'Người được ủy quyền quản lý', value: 'Người được ủy quyền' },
                    { label: 'Kế toán trưởng / Phụ trách thuế', value: 'Kế toán trưởng' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="city"
                label={
                  <span>
                    Tỉnh / Thành phố trụ sở <Text type="danger">(* Bắt buộc)</Text>
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
              >
                <Select
                  size="large"
                  showSearch
                  options={[
                    { label: 'TP. Hồ Chí Minh', value: 'TP. Hồ Chí Minh' },
                    { label: 'Hà Nội', value: 'Hà Nội' },
                    { label: 'Đà Nẵng', value: 'Đà Nẵng' },
                    { label: 'Hải Phòng', value: 'Hải Phòng' },
                    { label: 'Cần Thơ', value: 'Cần Thơ' },
                    { label: 'Bình Dương', value: 'Bình Dương' },
                    { label: 'Đồng Nai', value: 'Đồng Nai' },
                    { label: 'Khác', value: 'Tỉnh/Thành khác' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="industry"
                label={
                  <span>
                    Ngành nghề chính <Text type="danger">(* Bắt buộc)</Text>
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng nhập ngành nghề hoạt động' }]}
              >
                <Input placeholder="Ví dụ: Dịch vụ nhà hàng và ăn uống lưu động" size="large" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item name="employeeCount" label="Quy mô nhân sự">
                <Select
                  size="large"
                  options={[
                    { label: '1 – 10 người', value: 5 },
                    { label: '10 – 50 người', value: 25 },
                    { label: '50 – 200 người', value: 100 },
                    { label: 'Trên 200 người', value: 300 },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item name="operatingStatus" label="Tình trạng hoạt động">
                <Select
                  size="large"
                  options={[
                    { label: 'Đang hoạt động bình thường', value: 'Đang hoạt động bình thường' },
                    { label: 'Mới thành lập (Dưới 1 năm)', value: 'Mới thành lập' },
                    { label: 'Đang tạm ngừng / Chuyển đổi', value: 'Đang tạm ngừng' },
                    { label: 'Đang tái cấu trúc', value: 'Đang tái cấu trúc' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Địa chỉ trụ sở chính (Theo ĐKKD)">
            <Input placeholder="Ví dụ: 120 Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, TP.HCM" size="large" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={handleNext} style={{ minWidth: 160 }}>
              Sang Bước 2 (Checklist Bối Cảnh)
            </Button>
          </div>
        </div>

        {/* ================= STEP 2 ================= */}
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <Alert
            message="Checklist thu thập bối cảnh ban đầu"
            description="Trả lời các câu hỏi tình huống này để AI & Rule Engine tự động trích xuất 9 nhóm dữ liệu ngữ cảnh (Context Engine) và sinh toàn bộ nhiệm vụ tuân thủ cần làm."
            type="success"
            showIcon
            icon={<ThunderboltOutlined />}
            style={{ marginBottom: 16 }}
          />

          <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 8 }}>
            {/* 1. Kế toán & Thuế */}
            <Card size="small" title="1. Chế độ kế toán & Phương pháp tính thuế GTGT" style={{ marginBottom: 12, borderRadius: 8 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="accountingRegime" label="Chế độ kế toán áp dụng" style={{ marginBottom: 8 }}>
                    <Radio.Group>
                      <Space direction="vertical">
                        <Radio value="TT133">Thông tư 133/2016/TT-BTC (Doanh nghiệp vừa và nhỏ)</Radio>
                        <Radio value="TT200">Thông tư 200/2014/TT-BTC (Doanh nghiệp lớn / toàn diện)</Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="vatMethod" label="Phương pháp kê khai thuế GTGT" style={{ marginBottom: 8 }}>
                    <Radio.Group>
                      <Space direction="vertical">
                        <Radio value="KHAU_TRU">Phương pháp Khấu trừ thuế</Radio>
                        <Radio value="TRUC_TIEP">Phương pháp Trực tiếp trên doanh thu</Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 2. Hóa đơn điện tử */}
            <Card size="small" title="2. Sử dụng Hóa đơn điện tử (Nghị định 123/2020/NĐ-CP)" style={{ marginBottom: 12, borderRadius: 8 }}>
              <Form.Item name="hasElectronicInvoice" style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Radio value={true}>Đã phát hành & sử dụng HĐĐT có mã của Cơ quan Thuế</Radio>
                  <Radio value={false}>Chưa đăng ký sử dụng hóa đơn điện tử</Radio>
                </Radio.Group>
              </Form.Item>
            </Card>

            {/* 3. Lao động & BHXH */}
            <Card size="small" title="3. Hợp đồng lao động & Đóng BHXH bắt buộc" style={{ marginBottom: 12, borderRadius: 8 }}>
              <Form.Item name="hasLaborContractAndInsurance" style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Space direction="vertical">
                    <Radio value="DA_DONG_DU">Đã ký HĐLĐ và đóng BHXH/BHYT/BHTN đầy đủ cho người lao động</Radio>
                    <Radio value="CHUA_DONG_BHXH">Đang sử dụng lao động nhưng chưa trích nộp BHXH bắt buộc</Radio>
                    <Radio value="CHUA_CO_LAO_DONG">Chưa phát sinh người lao động chính thức (Chỉ có chủ sở hữu)</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Card>

            {/* 4. PCCC */}
            <Card size="small" title="4. Phương án PCCC & An toàn cơ sở hoạt động" style={{ marginBottom: 12, borderRadius: 8 }}>
              <Form.Item name="hasFireSafetyCert" style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Radio value={true}>Đã có hồ sơ quản lý PCCC cơ sở / Thuê tòa nhà có thẩm duyệt PCCC</Radio>
                  <Radio value={false}>Chưa lập hồ sơ PCCC hoặc địa điểm chưa được nghiệm thu PCCC</Radio>
                </Radio.Group>
              </Form.Item>
            </Card>

            {/* 5. Giấy phép con */}
            <Card size="small" title="5. Giấy phép con theo ngành nghề (ATTP, GP Lao động, Môi trường...)" style={{ marginBottom: 12, borderRadius: 8 }}>
              <Form.Item name="hasSectoralPermit" style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Radio value={true}>Ngành nghề có phát sinh giấy phép con (Đã có hoặc đang cần làm)</Radio>
                  <Radio value={false}>Ngành nghề kinh doanh thông thường, không cần giấy phép con</Radio>
                </Radio.Group>
              </Form.Item>
            </Card>

            {/* 6. Nhãn hiệu */}
            <Card size="small" title="6. Đăng ký bảo hộ nhãn hiệu / Logo thương hiệu" style={{ marginBottom: 12, borderRadius: 8 }}>
              <Form.Item name="hasTrademarkRegistered" style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Radio value={true}>Đã nộp đơn hoặc được cấp văn bằng bảo hộ tại Cục Sở Hữu Trí Tuệ</Radio>
                  <Radio value={false}>Chưa đăng ký bảo hộ nhãn hiệu độc quyền</Radio>
                </Radio.Group>
              </Form.Item>
            </Card>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button size="large" icon={<ArrowLeftOutlined />} onClick={handlePrev}>
              Quay lại Bước 1
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleSubmit}
              loading={submitting}
              style={{
                minWidth: 260,
                height: 46,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                borderColor: '#52c41a',
              }}
            >
              Hoàn Tất Khởi Tạo & Kích Hoạt Hệ Thống
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};
