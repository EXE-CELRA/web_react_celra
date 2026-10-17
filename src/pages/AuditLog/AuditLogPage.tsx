import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Space, Button, Modal } from 'antd';
import { AuditOutlined, SyncOutlined, EyeOutlined } from '@ant-design/icons';
import apiClient from '../../api/client';
import type { AuditEvent } from '../../types';

const { Text, Paragraph } = Typography;

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditEvent | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/audit-log');
      setLogs(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'actorName',
      key: 'actorName',
      width: 180,
      render: (name: string, record: AuditEvent) => (
        <div>
          <Text strong>{name || 'Hệ thống'}</Text>
          {record.actorRole && (
            <div>
              <Tag color="blue" style={{ fontSize: 10 }}>
                {record.actorRole}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 170,
      render: (action: string) => {
        const color =
          action.includes('CREATE')
            ? 'green'
            : action.includes('UPDATE')
            ? 'blue'
            : action.includes('DELETE')
            ? 'red'
            : action.includes('VERIFY')
            ? 'cyan'
            : 'purple';
        return <Tag color={color}>{action}</Tag>;
      },
    },
    {
      title: 'Tài nguyên tác động',
      dataIndex: 'resource',
      key: 'resource',
      width: 160,
      render: (res: string) => <Tag color="geekblue">{res}</Tag>,
    },
    {
      title: 'Chi tiết thay đổi',
      key: 'details',
      render: (_: any, record: AuditEvent) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedLog(record)}>
          Xem chi tiết Payload
        </Button>
      ),
    },
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      render: (ip: string) => <Text type="secondary">{ip || 'Internal'}</Text>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title={
          <Space>
            <AuditOutlined style={{ color: '#1677ff' }} />
            <span>Nhật Ký Kiểm Toán Bất Biến (Immutable Audit Trail)</span>
          </Space>
        }
        extra={
          <Button icon={<SyncOutlined />} onClick={fetchLogs}>
            Làm mới
          </Button>
        }
        style={{ borderRadius: 10 }}
      >
        <Paragraph type="secondary">
          Mọi hành vi khởi tạo, chỉnh sửa dữ liệu ngữ cảnh, duyệt chứng từ, giải phóng ký quỹ ví và nộp báo cáo đều được
          ghi vết tự động phục vụ công tác thanh tra, kiểm toán độc lập và bảo vệ pháp lý cho doanh nghiệp.
        </Paragraph>

        <Table dataSource={logs} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 12 }} />
      </Card>

      {/* Log Detail Modal */}
      <Modal
        title={`Chi Tiết Nhật Ký Kiểm Toán: ${selectedLog?.action} (${selectedLog?.resource})`}
        open={!!selectedLog}
        onCancel={() => setSelectedLog(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSelectedLog(null)}>
            Đóng
          </Button>,
        ]}
        width={650}
      >
        {selectedLog && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Thời gian: </Text>
              <Text>{new Date(selectedLog.createdAt).toLocaleString('vi-VN')}</Text>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Người thực hiện: </Text>
              <Text>
                {selectedLog.actorName} ({selectedLog.actorRole})
              </Text>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Tài nguyên ID: </Text>
              <Text code>{selectedLog.resourceId || 'N/A'}</Text>
            </div>

            {selectedLog.oldValues && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ color: '#cf1322' }}>
                  Dữ liệu trước thay đổi (Old Value):
                </Text>
                <pre
                  style={{
                    backgroundColor: '#fff1f0',
                    padding: 8,
                    borderRadius: 6,
                    fontSize: 12,
                    maxHeight: 180,
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(selectedLog.oldValues, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.newValues && (
              <div>
                <Text strong style={{ color: '#389e0d' }}>
                  Dữ liệu sau thay đổi (New Value):
                </Text>
                <pre
                  style={{
                    backgroundColor: '#f6ffed',
                    padding: 8,
                    borderRadius: 6,
                    fontSize: 12,
                    maxHeight: 180,
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(selectedLog.newValues, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
