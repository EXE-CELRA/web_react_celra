import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Input,
  List,
  Avatar,
  Modal,
  message,
  Empty,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  UploadOutlined,
  UserOutlined,
  CalendarOutlined,
  AuditOutlined,
  SendOutlined,
  AlertOutlined,
  FileTextOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import { useTaskStore } from '../../store/useTaskStore';
import type { TaskItem } from '../../types';
import { TaskStatusTag, PriorityTag } from './StatusBadge';
import { EvidenceUploadModal } from './EvidenceUploadModal';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { formatVNCalendarDate, getRemainingDaysInfo, STATUTORY_PERIOD_METAS } from '../../utils/taxCalendar';

const { Text, Paragraph } = Typography;

function isNewStatus(status?: string): boolean {
  if (!status) return true;
  const s = String(status).toLowerCase();
  return s === 'need_info' || s === 'pending_assignee' || s === 'todo';
}

function isInProgressStatus(status?: string): boolean {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return (
    s === 'in_progress' ||
    s === 'waiting_document' ||
    s === 'waiting_verification' ||
    s === 'need_expert'
  );
}

function isCompletedStatus(status?: string): boolean {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return s === 'completed' || s === 'done' || s === 'verified';
}

interface TaskDetailDrawerProps {
  task: TaskItem | null;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  open,
  onClose,
  onRefresh,
}) => {
  const {
    selectedTask,
    comments,
    fetchTaskById,
    fetchComments,
    addComment,
    updateTaskStatus,
  } = useTaskStore();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [noEvidenceModalOpen, setNoEvidenceModalOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open && task?.id) {
      fetchTaskById(task.id);
      fetchComments(task.id);
    }
  }, [open, task?.id]);

  if (!task) return null;

  // Lấy dữ liệu mới nhất từ selectedTask nếu trùng ID, nếu không dùng task
  const currentTask = selectedTask && selectedTask.id === task.id ? selectedTask : task;
  const isNew = isNewStatus(currentTask.status);
  const isInProgress = isInProgressStatus(currentTask.status);
  const isCompleted = isCompletedStatus(currentTask.status);

  const periodMeta = currentTask.periodCycle
    ? STATUTORY_PERIOD_METAS[currentTask.periodCycle as keyof typeof STATUTORY_PERIOD_METAS]
    : null;
  const remaining = getRemainingDaysInfo(currentTask.dueDate || '');
  const basis = currentTask.legalBasis || currentTask.legalCitation || '';
  const cleanBasis = cleanDLPLUrl(basis);
  const directUrl = (cleanBasis.startsWith('http') ? cleanBasis : null) || matchCoreLegalDocUrl(basis);

  // 1. Chuyển từ "Mới" sang "Đang thực hiện"
  const handleStartTask = async () => {
    setUpdating(true);
    try {
      await updateTaskStatus(currentTask.id, 'in_progress', 'Chủ doanh nghiệp bắt đầu thực hiện tác vụ');
      message.success('Đã chuyển sang trạng thái: Đang thực hiện');
      fetchTaskById(currentTask.id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi cập nhật');
    } finally {
      setUpdating(false);
    }
  };

  // 2. Bấm "Hoàn thành" -> Kiểm tra có chứng từ chưa
  const handleCompleteClick = () => {
    const hasUploadedDoc =
      (selectedTask?.documents && selectedTask.documents.length > 0) ||
      (currentTask?.documents && currentTask.documents.length > 0);

    if (!hasUploadedDoc) {
      // Chưa có bằng chứng -> Hiện modal xác nhận không chịu trách nhiệm
      setNoEvidenceModalOpen(true);
    } else {
      // Đã có bằng chứng -> Hoàn thành trực tiếp
      executeComplete('Chủ doanh nghiệp xác nhận hoàn thành kèm minh chứng');
    }
  };

  // Thực hiện chuyển sang Hoàn thành
  const executeComplete = async (reason?: string) => {
    setUpdating(true);
    try {
      await updateTaskStatus(
        currentTask.id,
        'completed',
        reason || 'Chủ doanh nghiệp cam kết tự chịu trách nhiệm hoàn tất không có chứng từ'
      );
      message.success('Đã hoàn thành nghĩa vụ tuân thủ!');
      setNoEvidenceModalOpen(false);
      fetchTaskById(currentTask.id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  // 3. Mở lại tác vụ (từ Hoàn thành quay lại Đang thực hiện)
  const handleReopenTask = async () => {
    setUpdating(true);
    try {
      await updateTaskStatus(currentTask.id, 'in_progress', 'Chủ doanh nghiệp mở lại tác vụ');
      message.info('Đã mở lại tác vụ (Đang thực hiện)');
      fetchTaskById(currentTask.id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi mở lại tác vụ');
    } finally {
      setUpdating(false);
    }
  };

  // Thêm ghi chú nội bộ cho task
  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    try {
      await addComment(currentTask.id, newNoteText.trim());
      setNewNoteText('');
      message.success('Đã lưu ghi chú cho tác vụ!');
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi lưu ghi chú');
    }
  };

  return (
    <>
      <Drawer
        title={
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{currentTask.title}</span>
              {currentTask.ruleCode && <Tag color="cyan">{currentTask.ruleCode}</Tag>}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mã tác vụ: <strong>{currentTask.code || currentTask.id}</strong> | Kỳ:{' '}
              <strong>{periodMeta?.badge || currentTask.periodCycle || 'Theo quy định'}</strong>
            </Text>
          </Space>
        }
        open={open}
        onClose={onClose}
        width={typeof window !== 'undefined' && window.innerWidth < 680 ? '100%' : 650}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 1. KHUNG THAO TÁC LUỒNG TRẠNG THÁI (CHỦ DOANH NGHIỆP TRỰC TIẾP VẬN HÀNH) */}
          <Card
            size="small"
            style={{
              borderRadius: 10,
              background: isCompleted ? '#f6ffed' : isInProgress ? '#e6f4ff' : '#f8fafc',
              border: isCompleted ? '1px solid #b7eb8f' : isInProgress ? '1px solid #91caff' : '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <Text strong style={{ fontSize: 13 }}>
                    Trạng thái hiện tại:
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <TaskStatusTag status={currentTask.status} />
                  </div>
                </div>

                {/* Các nút hành động tương ứng với từng giai đoạn */}
                <Space>
                  {/* Giai đoạn 1: MỚI -> Nút Bắt Đầu Thực Hiện */}
                  {isNew && (
                    <Button
                      type="primary"
                      size="large"
                      loading={updating}
                      icon={<PlayCircleOutlined />}
                      onClick={handleStartTask}
                      style={{ backgroundColor: '#1677ff', fontWeight: 600 }}
                    >
                      Bắt Đầu Thực Hiện
                    </Button>
                  )}

                  {/* Giai đoạn 2: ĐANG THỰC HIỆN -> Nút Hoàn Thành */}
                  {isInProgress && (
                    <Button
                      type="primary"
                      size="large"
                      loading={updating}
                      icon={<CheckCircleOutlined />}
                      onClick={handleCompleteClick}
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontWeight: 600 }}
                    >
                      Hoàn Thành Nghĩa Vụ
                    </Button>
                  )}

                  {/* Giai đoạn 3: ĐÃ HOÀN THÀNH -> Nút Mở Lại */}
                  {isCompleted && (
                    <Button
                      size="middle"
                      loading={updating}
                      icon={<ClockCircleOutlined />}
                      onClick={handleReopenTask}
                    >
                      Đánh Dấu Chưa Xong (Mở Lại)
                    </Button>
                  )}
                </Space>
              </div>

              {/* Nút Upload minh chứng (cho phép ở mọi trạng thái để bổ sung Context) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  paddingTop: 10,
                }}
              >
                <Button
                  type="dashed"
                  icon={<UploadOutlined />}
                  onClick={() => setUploadModalOpen(true)}
                  style={{ borderColor: '#1677ff', color: '#1677ff' }}
                >
                  Tải Lên Minh Chứng & Lưu Context Doanh Nghiệp
                </Button>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {selectedTask?.documents?.length || 0} tệp đã lưu vào context
                </span>
              </div>
            </div>
          </Card>

          {/* 2. DANH SÁCH FILE MINH CHỨNG ĐÃ LƯU VÀO CONTEXT (NẾU CÓ) */}
          {selectedTask?.documents && selectedTask.documents.length > 0 && (
            <Card
              size="small"
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#52c41a' }} />
                  <span style={{ fontWeight: 600 }}>Hồ Sơ & Minh Chứng Đã Lưu Vào Context ({selectedTask.documents.length})</span>
                </Space>
              }
              style={{ borderRadius: 10 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedTask.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#f6ffed',
                      border: '1px solid #b7eb8f',
                    }}
                  >
                    <Space>
                      <PaperClipOutlined style={{ color: '#52c41a' }} />
                      <span style={{ fontWeight: 500, fontSize: 13, color: '#1f2937' }}>{doc.name}</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>({doc.fileSize})</span>
                    </Space>
                    <Tag color="green">Đã lưu Context</Tag>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 3. THÔNG TIN HẠN CHÓT & PHÂN LOẠI */}
          <Card size="small" style={{ borderRadius: 10, background: '#f8fafc' }}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Mức độ ưu tiên:
                </Text>
                <div>
                  <PriorityTag priority={currentTask.priority} />
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Người / Vai trò:
                </Text>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <UserOutlined style={{ color: '#1677ff' }} /> Chủ doanh nghiệp
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Hạn chót pháp lý:
                </Text>
                <div style={{ fontWeight: 700, color: '#0958d9', fontSize: 13 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {formatVNCalendarDate(currentTask.dueDate || '')}
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Thời hạn còn lại:
                </Text>
                <div>
                  <Tag color={remaining.tagColor} style={{ fontWeight: 500 }}>
                    {remaining.label}
                  </Tag>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 4. CĂN CỨ PHÁP LUẬT VÀ CÔNG THỨC TÍNH */}
          {basis && (
            <Card
              size="small"
              title={
                <Space>
                  <AuditOutlined style={{ color: '#1677ff' }} />
                  <span>Căn Cứ Pháp Lý & Quy Định Liên Quan</span>
                </Space>
              }
              style={{ borderRadius: 10 }}
            >
              <Paragraph style={{ fontSize: 12, margin: 0 }}>{cleanBasis}</Paragraph>
              {directUrl && (
                <div style={{ marginTop: 8 }}>
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: '#1677ff', fontWeight: 500 }}
                  >
                    Tra cứu toàn văn trên CSDL Dữ Liệu Pháp Luật ↗
                  </a>
                </div>
              )}
              {currentTask.calculationBasisJson?.basis && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: '#64748b',
                    background: '#f1f5f9',
                    padding: '6px 10px',
                    borderRadius: 6,
                  }}
                >
                  <strong>Cách tính hạn:</strong> {currentTask.calculationBasisJson.basis}
                </div>
              )}
            </Card>
          )}

          {/* 5. MÔ TẢ & HƯỚNG DẪN THỰC HIỆN */}
          {currentTask.description && (
            <Card size="small" title="Hướng Dẫn & Nội Dung Thực Hiện" style={{ borderRadius: 10 }}>
              <Paragraph style={{ fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>
                {currentTask.description}
              </Paragraph>
            </Card>
          )}

          {/* 6. GHI CHÚ NỘI BỘ CHO TÁC VỤ */}
          <Card size="small" title="Sổ Ghi Chú & Lưu Vết Tác Vụ" style={{ borderRadius: 10 }}>
            {comments.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có ghi chú nào cho tác vụ này."
                style={{ margin: '8px 0' }}
              />
            ) : (
              <List
                size="small"
                dataSource={comments}
                renderItem={(cmt) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Text strong style={{ fontSize: 12 }}>
                          {cmt.user?.fullName || (cmt.user as any)?.name || 'Chủ doanh nghiệp'}
                        </Text>
                      }
                      description={
                        <div>
                          <div style={{ fontSize: 12, color: '#1e293b' }}>{cmt.content}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                            {new Date(cmt.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}

            <div style={{ marginTop: 12 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Ghi chú thêm lưu ý cho công việc này..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onPressEnter={handleAddNote}
                />
                <Button type="primary" icon={<SendOutlined />} onClick={handleAddNote}>
                  Lưu Ghi Chú
                </Button>
              </Space.Compact>
            </div>
          </Card>
        </div>
      </Drawer>

      {/* MODAL TẢI LÊN MINH CHỨNG & LƯU CONTEXT */}
      <EvidenceUploadModal
        visible={uploadModalOpen}
        taskId={currentTask.id}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          message.success('Đã tải lên và lưu vào Context Doanh Nghiệp!');
          fetchTaskById(currentTask.id);
          if (onRefresh) onRefresh();
        }}
      />

      {/* POPUP CONFIRM CẢNH BÁO: CHƯA CẬP NHẬT BẰNG CHỨNG THÌ DOANH NGHIỆP TỰ CHỊU TRÁCH NHIỆM */}
      <Modal
        title={
          <Space>
            <AlertOutlined style={{ color: '#faad14', fontSize: 20 }} />
            <span style={{ fontWeight: 700, color: '#d46b08' }}>
              Xác Nhận Hoàn Thành (Chưa Có Bằng Chứng)
            </span>
          </Space>
        }
        open={noEvidenceModalOpen}
        onCancel={() => setNoEvidenceModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setNoEvidenceModalOpen(false)}>
            Quay Lại Tải Bằng Chứng
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            loading={updating}
            onClick={() => executeComplete()}
          >
            Tôi Xác Nhận Tự Chịu Trách Nhiệm & Hoàn Thành
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <Paragraph style={{ fontSize: 13, color: '#1e293b', marginBottom: 12 }}>
            Tác vụ này <strong>chưa được cập nhật tệp hồ sơ / chứng từ minh chứng</strong> lưu vào Context.
          </Paragraph>
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.6,
              color: '#ad6800',
            }}
          >
            ⚠️ <strong>Cảnh báo trách nhiệm pháp lý:</strong> Bạn chưa cập nhật bằng chứng cho nghĩa vụ này. Sau này khi cơ quan chức năng thanh tra, kiểm tra, hệ thống CELRA và nền tảng <strong>sẽ không chịu trách nhiệm pháp lý</strong> đối với việc thiếu tài liệu lưu trữ.
          </div>
          <Paragraph style={{ fontSize: 13, color: '#475569', marginTop: 12, marginBottom: 0 }}>
            Bạn có chắc chắn muốn xác nhận hoàn tất nghĩa vụ này mà không có bằng chứng không?
          </Paragraph>
        </div>
      </Modal>
    </>
  );
};

export default TaskDetailDrawer;
