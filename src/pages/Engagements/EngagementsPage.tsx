import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Row, Col, Space } from 'antd';
import { FileProtectOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import apiClient from '../../api/client';

const { Text, Paragraph } = Typography;

export const EngagementsPage: React.FC = () => {
  const [engagements, setEngagements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEngagements();
  }, []);

  const fetchEngagements = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/service-engagements');
      setEngagements(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Dịch vụ / Hạng mục công việc',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (text: string, record: any) => (
        <div>
          <Text strong>{text || record.name}</Text>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Phạm vi hợp đồng',
      dataIndex: 'isInScope',
      key: 'isInScope',
      width: 170,
      render: (inScope: boolean) =>
        inScope ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Trong phạm vi (In-Scope)
          </Tag>
        ) : (
          <Tag color="volcano" icon={<ExclamationCircleOutlined />}>
            Ngoài phạm vi (Out-of-Scope)
          </Tag>
        ),
    },
    {
      title: 'Đơn vị phụ trách',
      dataIndex: 'responsibleParty',
      key: 'responsibleParty',
      width: 180,
      render: (party: string) => <Tag color="blue">{party || 'Kế toán / Đại lý nội bộ'}</Tag>,
    },
    {
      title: 'Cơ chế kích hoạt',
      dataIndex: 'triggerMechanism',
      key: 'triggerMechanism',
      render: (_: any, record: any) =>
        record.isInScope ? 'Định kỳ hàng tháng/quý' : 'Ủy quyền chuyên gia & Ký quỹ ví',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title={
          <Space>
            <FileProtectOutlined style={{ color: '#1677ff' }} />
            <span>Phạm Vi Dịch Vụ & Ranh Giới Trách Nhiệm (Scope of Engagement)</span>
          </Space>
        }
        style={{ borderRadius: 10 }}
      >
        <Paragraph type="secondary">
          CELRA phân tách minh bạch giữa các hạng mục dịch vụ định kỳ trong gói (In-Scope) và các công việc phát sinh
          đặc thù (Out-of-Scope) nhằm loại bỏ hoàn toàn tranh chấp giữa Chủ doanh nghiệp và Đại lý/Kế toán.
        </Paragraph>

        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} md={12}>
            <Card
              size="small"
              style={{
                borderRadius: 8,
                borderLeft: '4px solid #52c41a',
                backgroundColor: '#f6ffed',
              }}
            >
              <Text strong style={{ color: '#389e0d' }}>
                <CheckCircleOutlined /> Hạng Mục Tiêu Chuẩn (In-Scope):
              </Text>
              <Paragraph style={{ margin: '8px 0 0', fontSize: 13 }}>
                Kê khai thuế GTGT, TNCN quý, Lập báo cáo tài chính năm, Quản lý hồ sơ tăng giảm lao động BHXH, Xuất hóa
                đơn điện tử định kỳ.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              size="small"
              style={{
                borderRadius: 8,
                borderLeft: '4px solid #fa541c',
                backgroundColor: '#fff2e8',
              }}
            >
              <Text strong style={{ color: '#d4380d' }}>
                <ExclamationCircleOutlined /> Hạng Mục Ngoài Gói (Out-of-Scope):
              </Text>
              <Paragraph style={{ margin: '8px 0 0', fontSize: 13 }}>
                Đại diện giải trình thanh tra thuế trực tiếp, Đăng ký giấy phép lao động cho người nước ngoài, Lập hồ sơ
                phê duyệt PCCC cơ sở, Đăng ký bảo hộ nhãn hiệu độc quyền.
              </Paragraph>
            </Card>
          </Col>
        </Row>

        <Table dataSource={engagements} columns={columns} rowKey="id" loading={loading} pagination={false} />
      </Card>
    </div>
  );
};
