import type { TaskDetailDrawerProps } from '../../interfaces';
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
  Select,
  Alert,
  Tooltip,
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
  BankOutlined,
  CopyOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTaskStore } from '../../store/useTaskStore';
import { TaskStatusTag, PriorityTag } from './StatusBadge';
import { EvidenceUploadModal } from './EvidenceUploadModal';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { formatVNCalendarDate, getRemainingDaysInfo, STATUTORY_PERIOD_METAS } from '../../utils/taxCalendar';

const { Text, Paragraph } = Typography;

const PRIORITY_WEIGHTS: Record<string, number> = {
  low: 1,
  LOW: 1,
  medium: 2,
  MEDIUM: 2,
  high: 3,
  HIGH: 3,
  urgent: 4,
  critical: 4,
  CRITICAL: 4,
};

function getPriorityWeight(p?: string | null): number {
  if (!p) return 2;
  return PRIORITY_WEIGHTS[p.toLowerCase()] || PRIORITY_WEIGHTS[p] || 2;
}

function getPriorityLabel(p?: string | null): string {
  if (!p) return 'Trung bình';
  const val = p.toLowerCase();
  if (val === 'urgent' || val === 'critical') return 'Khẩn cấp';
  if (val === 'high') return 'Cao';
  if (val === 'medium') return 'Trung bình';
  if (val === 'low') return 'Thấp';
  return p;
}

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
    updateTaskPriority,
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
  const remaining = getRemainingDaysInfo(currentTask.hanChot || currentTask.dueDate || '');
  const statutoryRisk = (currentTask.statutoryPriority || currentTask.legalRisk || currentTask.priority || 'medium') as string;
  const currentOperationalPriority = (currentTask.customPriority || currentTask.priority || 'medium') as string;
  const hasCustomPriority = Boolean(
    currentTask.customPriority &&
    String(currentTask.customPriority).toLowerCase() !== String(statutoryRisk).toLowerCase()
  );
  const isPriorityDowngraded = hasCustomPriority && getPriorityWeight(currentOperationalPriority) < getPriorityWeight(statutoryRisk);
  const basis = currentTask.canCuPhapLy || currentTask.legalBasis || currentTask.legalCitation || '';
  const cleanBasis = cleanDLPLUrl(basis);
  const directUrl = (cleanBasis.startsWith('http') ? cleanBasis : null) || matchCoreLegalDocUrl(basis);
  const isCitTask = Boolean(
    currentTask.code?.startsWith('CIT_') ||
    currentTask.title?.toLowerCase().includes('tndn') ||
    currentTask.category?.toLowerCase().includes('tndn')
  );
  const taxMatch = currentTask.description?.match(/tạm nộp ước tính:\s*([0-9.,]+)\s*VNĐ/i);

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
              <span style={{ fontWeight: 700, fontSize: 16 }}>{currentTask.tieuDe || currentTask.title}</span>
              {(currentTask.maQuyTac || currentTask.ruleCode) && <Tag color="cyan">{currentTask.maQuyTac || currentTask.ruleCode}</Tag>}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mã tác vụ: <strong>{currentTask.maNhiemVu || currentTask.code || currentTask.id}</strong> | Kỳ:{' '}
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

          {/* 3. THÔNG TIN HẠN CHÓT & ĐIỀU PHỐI ƯU TIÊN (PHƯƠNG ÁN A) */}
          <Card size="small" style={{ borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Row gutter={[12, 14]}>
              {/* Cột 1: Rủi ro luật định (Cố định bởi Luật) */}
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                    <SafetyCertificateOutlined style={{ color: '#1677ff', marginRight: 4 }} />
                    Rủi ro luật định (Hệ thống):
                  </Text>
                  <Tooltip title="Mức độ rủi ro xử phạt vi phạm & tính cấp bách theo quy định pháp luật hiện hành. Không thể tự ý hạ thấp trong hồ sơ pháp lý.">
                    <InfoCircleOutlined style={{ fontSize: 11, color: '#94a3b8', cursor: 'pointer' }} />
                  </Tooltip>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PriorityTag priority={statutoryRisk as any} />
                </div>
              </Col>

              {/* Cột 2: Mức ưu tiên vận hành (Chủ DN tự điều phối) */}
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                    <SettingOutlined style={{ color: '#fa8c16', marginRight: 4 }} />
                    Ưu tiên vận hành (Nội bộ):
                  </Text>
                  {hasCustomPriority && (
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0, height: 'auto', fontSize: 11, color: '#1677ff' }}
                      onClick={async () => {
                        try {
                          await updateTaskPriority(currentTask.id, statutoryRisk, 'Khôi phục theo mức rủi ro luật định');
                          message.success('Đã khôi phục mức ưu tiên theo luật định');
                          if (onRefresh) onRefresh();
                        } catch {
                          message.error('Lỗi khi khôi phục');
                        }
                      }}
                    >
                      Khôi phục gốc
                    </Button>
                  )}
                </div>
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  value={String(currentOperationalPriority).toLowerCase()}
                  onChange={async (val) => {
                    try {
                      await updateTaskPriority(currentTask.id, val);
                      message.success('Đã cập nhật mức ưu tiên vận hành');
                      if (onRefresh) onRefresh();
                    } catch {
                      message.error('Không thể cập nhật mức ưu tiên');
                    }
                  }}
                  options={[
                    { label: '🔴 Khẩn cấp (Urgent)', value: 'urgent' },
                    { label: '🟠 Cao (High)', value: 'high' },
                    { label: '🟡 Trung bình (Medium)', value: 'medium' },
                    { label: '🔵 Thấp (Low)', value: 'low' },
                  ]}
                />
              </Col>

              {/* Cảnh báo rủi ro nếu Chủ DN hạ mức ưu tiên thấp hơn rủi ro luật định */}
              {isPriorityDowngraded && (
                <Col span={24}>
                  <Alert
                    type="warning"
                    showIcon
                    icon={<WarningOutlined style={{ color: '#d46b08' }} />}
                    style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #ffe58f', background: '#fffbe6' }}
                    message={
                      <span>
                        <strong style={{ color: '#d4380d' }}>Cảnh báo tuân thủ:</strong> Tác vụ này có mức rủi ro luật định là{' '}
                        <strong style={{ color: '#cf1322' }}>{getPriorityLabel(statutoryRisk).toUpperCase()}</strong>.
                        Việc giảm mức ưu tiên vận hành nội bộ <u>không làm giảm chế tài xử phạt tiền hoặc đình chỉ</u> từ Cơ quan Thuế/Cơ quan Nhà nước nếu thực hiện chậm trễ.
                      </span>
                    }
                  />
                </Col>
              )}

              {/* Thông tin người phụ trách & thời hạn */}
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Người / Vai trò:
                </Text>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <UserOutlined style={{ color: '#1677ff' }} /> Chủ doanh nghiệp
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Thời hạn còn lại:
                </Text>
                <div style={{ marginTop: 2 }}>
                  <Tag color={remaining.tagColor} style={{ fontWeight: 500, margin: 0 }}>
                    {remaining.label}
                  </Tag>
                </div>
              </Col>
              <Col span={24}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Hạn chót pháp lý:
                </Text>
                <div style={{ fontWeight: 700, color: '#0958d9', fontSize: 13, marginTop: 2 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {formatVNCalendarDate(currentTask.dueDate || '')}
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

          {/* HƯỚNG DẪN NỘP THUẾ TNDN QUA CỔNG ETAX */}
          {isCitTask && (
            <Card
              size="small"
              style={{
                borderRadius: 12,
                border: '1px solid #bfdbfe',
                background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                boxShadow: '0 2px 8px rgba(37,99,235,0.06)',
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <Space size={6}>
                    <BankOutlined style={{ color: '#2563eb', fontSize: 16 }} />
                    <span style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 13 }}>
                      Hướng Dẫn Nộp Thuế TNDN Qua Cổng eTax (thuedientu.gdt.gov.vn)
                    </span>
                  </Space>
                  <Button
                    type="primary"
                    size="small"
                    icon={<GlobalOutlined />}
                    href="https://thuedientu.gdt.gov.vn"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', fontWeight: 600, fontSize: 12 }}
                  >
                    Mở Cổng eTax ↗
                  </Button>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Thông số cốt lõi cần điền trên Giấy nộp tiền */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #dbeafe',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Mã Tiểu mục (NDKT):</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Tag color="blue" style={{ fontSize: 12, fontWeight: 700, margin: 0, padding: '1px 8px' }}>
                        1052
                      </Tag>
                      <span style={{ fontSize: 11, color: '#475569' }}>Thuế TNDN từ SXKD</span>
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined style={{ fontSize: 11 }} />}
                        onClick={() => {
                          navigator.clipboard.writeText('1052');
                          message.success('Đã chép mã tiểu mục 1052');
                        }}
                        style={{ padding: '0 4px', height: 20 }}
                        title="Sao chép mã 1052"
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Loại nghĩa vụ & Kỳ thuế:</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                      Tạm nộp theo Quý (VD: {currentTask.title?.includes('Quý') ? currentTask.title.split(' ')[4] || 'Q2/2026' : 'Quyết toán năm'})
                    </div>
                  </div>

                  {taxMatch && (
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Số tiền tạm tính từ sổ:</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                          {taxMatch[1]} VNĐ
                        </span>
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined style={{ fontSize: 11 }} />}
                          onClick={() => {
                            const raw = taxMatch[1].replace(/\./g, '');
                            navigator.clipboard.writeText(raw);
                            message.success(`Đã chép số tiền: ${raw}`);
                          }}
                          style={{ padding: '0 4px', height: 20 }}
                          title="Sao chép số tiền nguyên bản"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5 Bước thao tác chuẩn trên Cổng Thuế điện tử */}
                <div style={{ fontSize: 12, color: '#334155' }}>
                  <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <InfoCircleOutlined style={{ color: '#2563eb' }} />
                    5 Bước nộp thuế điện tử chuẩn xác:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <span style={{ backgroundColor: '#2563eb', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>1</span>
                      <div>
                        <strong>Đăng nhập Cổng eTax:</strong> Vào <code>thuedientu.gdt.gov.vn</code> &gt; Chọn <strong>DOANH NGHIỆP</strong> &gt; Đăng nhập tài khoản Quản lý (<code>[MST]-QL</code>) và cắm USB Chữ ký số (Token).
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <span style={{ backgroundColor: '#2563eb', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>2</span>
                      <div>
                        <strong>Lập Giấy nộp tiền (GNT):</strong> Vào menu <strong>Nộp thuế</strong> &gt; <strong>Lập Giấy nộp tiền</strong> &gt; Chọn Ngân hàng nộp thuế đã liên kết &gt; Bấm <strong>Truy vấn</strong>.
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <span style={{ backgroundColor: '#2563eb', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>3</span>
                      <div>
                        <strong>Điền thông tin khoản nộp:</strong> Chọn Cơ quan quản lý thu; Nhập Tiểu mục <strong>1052</strong>; Chọn kỳ tính thuế theo quý; Điền số tiền thuế TNDN tạm nộp ước tính.
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      <span style={{ backgroundColor: '#2563eb', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>4</span>
                      <div>
                        <strong>Ký điện tử &amp; Nộp:</strong> Bấm <strong>Hoàn thành</strong> để kiểm tra lại &gt; Bấm <strong>Ký và nộp</strong> &gt; Nhập mã PIN Token. Tiền sẽ được ngân hàng tự động trích nộp vào Kho bạc Nhà nước.
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: '#f0fdf4', padding: '6px 10px', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                      <span style={{ backgroundColor: '#16a34a', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>5</span>
                      <div>
                        <strong>Lưu bằng chứng hoàn thành:</strong> Vào <strong>Tra cứu giấy nộp tiền</strong> trên eTax &gt; Tải file PDF Giấy nộp tiền &gt; Nhấn nút <strong>"Tải Lên Minh Chứng"</strong> ở đầu trang này để lưu vào hồ sơ kiểm toán.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cảnh báo luật định 80% */}
                <div style={{ fontSize: 11, color: '#b45309', backgroundColor: '#fef3c7', padding: '6px 10px', borderRadius: 6, border: '1px solid #fde68a' }}>
                  * <strong>Quy tắc ngưỡng 80% (Nghị định 91/2022/NĐ-CP):</strong> Tổng số thuế TNDN tạm nộp 4 quý tối thiểu phải đạt 80% số thuế TNDN phải nộp cả năm khi quyết toán, nếu nộp thiếu sẽ phát sinh tiền chậm nộp 0,03%/ngày.
                </div>
              </div>
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
