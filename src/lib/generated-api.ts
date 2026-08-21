// This file is generated. Do not edit manually.
// Source: eclessgo-api/src/infrastructure/api/main.py -> app.openapi()

export interface ApiResponse<T> {
  data: T;
  message?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  statusCode: number;
  code?: string;
  error: string;
  message: string;
  timestamp?: string;
  details?: unknown;
}

export interface AddComplianceNoteRequest {
  note: string;
  visibility?: ComplianceNoteVisibility;
}

export interface AnnouncementRequest {
  title: string;
  content: string;
  is_pinned?: boolean;
  attachments?: unknown[];
}

export interface AssignmentResponseRequest {
  response: "CONFIRMED" | "DECLINED";
  response_note?: string | null;
}

export interface AuditLogResponse {
  id: string;
  actor_user_id?: string | null;
  church_id?: string | null;
  action: string;
  target_type: string;
  target_id?: string | null;
  outcome: string;
  request_id?: string | null;
  ip_address?: string | null;
  details?: Record<string, unknown>;
  created_at: string;
}

export type AuditOutcome = "SUCCESS" | "FAILURE" | "DENIED";

export interface AuthResponse {
  user: UserResponse;
  tokens: TokenPairResponse;
}

export interface BibleFavoriteRequest {
  version?: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number | null;
  text: string;
  notes?: string | null;
  tags?: unknown[];
}

export interface BiblePlanProgressRequest {
  currentDay: number;
  progress?: Record<string, unknown>;
}

export interface Body_upload_register_church_media_api_v1_auth_register_church_uploads_post {
  purpose: string;
  file: string;
}

export interface CampaignCreateRequest {
  title: string;
  description?: string | null;
  image?: string | null;
  goal: number;
  start_date?: string | null;
  end_date?: string | null;
  is_public?: boolean;
  show_progress?: boolean;
}

export interface CampaignResponse {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  goal: number;
  current_amount: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

export interface CampaignUpdateRequest {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  goal?: number | null;
  end_date?: string | null;
  is_public?: boolean | null;
  show_progress?: boolean | null;
  status?: string | null;
}

export interface CheckinRequest {
  churchId: string;
  location?: Record<string, unknown>;
}

export interface ChurchAddressUpdateRequest {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  zip_code?: string | null;
  address?: string | null;
  formatted_address?: string | null;
}

export interface ChurchContactUpdateRequest {
  email?: string | null;
  phone?: string | null;
}

export interface ChurchLocationUpdateRequest {
  lat: number;
  lng: number;
}

export interface ChurchPublicationReviewResponse {
  id: string;
  name: string;
  slug: string;
  denomination: string;
  description?: string | null;
  address: Record<string, unknown>;
  location: Record<string, unknown>;
  contact: Record<string, unknown>;
  schedule: unknown[];
  member_count: number;
  plan: string;
  pix_key?: string | null;
  is_live: boolean;
  live_url?: string | null;
  live_started_at?: string | null;
  donations_enabled: boolean;
  thumbnail?: string | null;
  photos?: unknown[];
  publication_status: string;
  publication_reviewed_at?: string | null;
  publication_review_reason?: string | null;
}

export type ChurchPublicationStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SUSPENDED";

export interface ChurchResponse {
  id: string;
  name: string;
  slug: string;
  denomination: string;
  description?: string | null;
  address: Record<string, unknown>;
  location: Record<string, unknown>;
  contact: Record<string, unknown>;
  schedule: unknown[];
  member_count: number;
  plan: string;
  pix_key?: string | null;
  is_live: boolean;
  live_url?: string | null;
  live_started_at?: string | null;
  donations_enabled: boolean;
  thumbnail?: string | null;
  photos?: unknown[];
}

export type ChurchRole = "MEMBER" | "CHURCH_MODERATOR" | "CHURCH_FINANCE" | "CHURCH_ADMIN";

export type ComplianceCategory = "HARASSMENT" | "ABUSE" | "DISCRIMINATION" | "FINANCIAL_IRREGULARITY" | "SPIRITUAL_ABUSE" | "DATA_PRIVACY" | "OTHER";

export type ComplianceNoteVisibility = "INTERNAL" | "PUBLIC_REPORTER";

export type ComplianceSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ComplianceStatus = "RECEIVED" | "TRIAGED" | "IN_REVIEW" | "ACTION_TAKEN" | "DISMISSED" | "CLOSED" | "ESCALATED";

export type ComplianceTargetType = "ANNOUNCEMENT" | "PRAYER" | "EVENT" | "GROUP" | "MEMBER" | "CHURCH" | "OTHER";

export interface CreateComplianceReportRequest {
  category: ComplianceCategory;
  severity?: ComplianceSeverity;
  subject: string;
  description: string;
  target_type?: ComplianceTargetType | null;
  target_id?: string | null;
  is_anonymous?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  evidence_links?: string[];
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: GlobalRole;
  preferences?: Record<string, unknown> | null;
}

export interface DashboardResponse {
  church: Record<string, unknown>;
  stats: Record<string, unknown>;
  finances: Record<string, unknown>;
  engagement: Record<string, unknown>;
  operational: Record<string, unknown>;
}

export interface DataResponse_AuthResponse_ {
  data: AuthResponse;
  message?: string | null;
}

export interface DataResponse_CampaignResponse_ {
  data: CampaignResponse;
  message?: string | null;
}

export interface DataResponse_ChurchPublicationReviewResponse_ {
  data: ChurchPublicationReviewResponse;
  message?: string | null;
}

export interface DataResponse_ChurchResponse_ {
  data: ChurchResponse;
  message?: string | null;
}

export interface DataResponse_CurrentUserResponse_ {
  data: CurrentUserResponse;
  message?: string | null;
}

export interface DataResponse_DashboardResponse_ {
  data: DashboardResponse;
  message?: string | null;
}

export interface DataResponse_DonationCheckoutResponse_ {
  data: DonationCheckoutResponse;
  message?: string | null;
}

export interface DataResponse_DonationChurchInfoResponse_ {
  data: DonationChurchInfoResponse;
  message?: string | null;
}

export interface DataResponse_DonationPublicStatusResponse_ {
  data: DonationPublicStatusResponse;
  message?: string | null;
}

export interface DataResponse_DonationStatusResponse_ {
  data: DonationStatusResponse;
  message?: string | null;
}

export interface DataResponse_ExpenseResponse_ {
  data: ExpenseResponse;
  message?: string | null;
}

export interface DataResponse_FinanceSummaryResponse_ {
  data: FinanceSummaryResponse;
  message?: string | null;
}

export interface DataResponse_ForgotPasswordResponse_ {
  data: ForgotPasswordResponse;
  message?: string | null;
}

export interface DataResponse_LegalDocumentsResponse_ {
  data: LegalDocumentsResponse;
  message?: string | null;
}

export interface DataResponse_LogoutResponse_ {
  data: LogoutResponse;
  message?: string | null;
}

export interface DataResponse_NotificationReadResponse_ {
  data: NotificationReadResponse;
  message?: string | null;
}

export interface DataResponse_NotificationsReadAllResponse_ {
  data: NotificationsReadAllResponse;
  message?: string | null;
}

export interface DataResponse_PanelAuthResponse_ {
  data: PanelAuthResponse;
  message?: string | null;
}

export interface DataResponse_PanelTokenResponse_ {
  data: PanelTokenResponse;
  message?: string | null;
}

export interface DataResponse_PaymentWebhookResponse_ {
  data: PaymentWebhookResponse;
  message?: string | null;
}

export interface DataResponse_PeaceContentResponse_ {
  data: PeaceContentResponse;
  message?: string | null;
}

export interface DataResponse_PeaceDeleteResponse_ {
  data: PeaceDeleteResponse;
  message?: string | null;
}

export interface DataResponse_PeaceExportResponse_ {
  data: PeaceExportResponse;
  message?: string | null;
}

export interface DataResponse_PeaceGeneratedPrayerResponse_ {
  data: PeaceGeneratedPrayerResponse;
  message?: string | null;
}

export interface DataResponse_PeaceMomentResponse_ {
  data: PeaceMomentResponse;
  message?: string | null;
}

export interface DataResponse_ProcessPushReceiptsResponse_ {
  data: ProcessPushReceiptsResponse;
  message?: string | null;
}

export interface DataResponse_PushHealthResponse_ {
  data: PushHealthResponse;
  message?: string | null;
}

export interface DataResponse_PushTokenResponse_ {
  data: PushTokenResponse;
  message?: string | null;
}

export interface DataResponse_RegisterChurchMediaUploadResponse_ {
  data: RegisterChurchMediaUploadResponse;
  message?: string | null;
}

export interface DataResponse_ResetPasswordResponse_ {
  data: ResetPasswordResponse;
  message?: string | null;
}

export interface DataResponse_ServiceScheduleResponse_ {
  data: ServiceScheduleResponse;
  message?: string | null;
}

export interface DataResponse_TeamMemberResponse_ {
  data: TeamMemberResponse;
  message?: string | null;
}

export interface DataResponse_TeamResponse_ {
  data: TeamResponse;
  message?: string | null;
}

export interface DataResponse_TestPushResponse_ {
  data: TestPushResponse;
  message?: string | null;
}

export interface DataResponse_TokenPairResponse_ {
  data: TokenPairResponse;
  message?: string | null;
}

export interface DataResponse_dict_ {
  data: Record<string, unknown>;
  message?: string | null;
}

export interface DataResponse_dict_str__list_PeaceFeelingResponse___ {
  data: Record<string, PeaceFeelingResponse[]>;
  message?: string | null;
}

export interface DataResponse_list_MyAssignmentResponse__ {
  data: MyAssignmentResponse[];
  message?: string | null;
}

export interface DataResponse_list_PeaceMomentResponse__ {
  data: PeaceMomentResponse[];
  message?: string | null;
}

export interface DataResponse_list_ServiceScheduleResponse__ {
  data: ServiceScheduleResponse[];
  message?: string | null;
}

export interface DataResponse_list_TeamMemberCandidateResponse__ {
  data: TeamMemberCandidateResponse[];
  message?: string | null;
}

export interface DataResponse_list_TeamMemberResponse__ {
  data: TeamMemberResponse[];
  message?: string | null;
}

export interface DataResponse_list_TeamResponse__ {
  data: TeamResponse[];
  message?: string | null;
}

export interface DataResponse_list_UserChurchResponse__ {
  data: UserChurchResponse[];
  message?: string | null;
}

export interface DonationCampaignPublicResponse {
  id: string;
  title: string;
  description?: string | null;
  goal: number;
  current: number;
  percentage: number;
  endDate?: string | null;
  isActive: boolean;
}

export interface DonationCheckoutResponse {
  id: string;
  status: string;
  status_label: string;
  status_message: string;
  next_status_check_seconds?: number | null;
  amount: number;
  payment_method: string;
  gateway_provider: string;
  simulated?: boolean;
  status_token?: string | null;
  status_token_expires_at?: string | null;
  checkout: Record<string, unknown>;
}

export interface DonationChurchInfoResponse {
  church_id: string;
  church_name: string;
  pix_key: string | null;
  donations_enabled: boolean;
  accepted_methods: string[];
  campaigns: DonationCampaignPublicResponse[];
}

export interface DonationCreateRequest {
  churchId: string;
  amount: number;
  type?: string;
  campaignId?: string | null;
  paymentMethod?: string;
  isAnonymous?: boolean;
  message?: string | null;
  payerName?: string | null;
  payerEmail?: string | null;
  payerCpf?: string | null;
}

export interface DonationPublicStatusResponse {
  id: string;
  status: string;
  status_label: string;
  status_message: string;
  status_detail?: string | null;
  is_final_status: boolean;
  next_status_check_seconds?: number | null;
  amount: number;
  payment_method?: string | null;
  created_at?: string | null;
  receipt_number?: string | null;
  receipt_url?: string | null;
}

export interface DonationRefundRequest {
  amount?: number | null;
  reason?: string | null;
}

export interface DonationStatusResponse {
  id: string;
  status: string;
  status_label: string;
  status_message: string;
  status_detail?: string | null;
  is_final_status: boolean;
  next_status_check_seconds?: number | null;
  amount: number;
  type?: string | null;
  payment_method?: string | null;
  church_amount: number | null;
  platform_fee: number | null;
  campaign_id: string | null;
  payer_name?: string | null;
  confirmed_at: string | null;
  created_at?: string | null;
  gateway_status?: string | null;
  gateway_provider?: string | null;
  receipt_number?: string | null;
  receipt_url?: string | null;
  checkout_payload?: Record<string, unknown> | null;
}

export interface DonationWebhookStatusResponse {
  id: string;
  status: string;
  status_label: string;
  is_final_status: boolean;
}

export interface ErrorResponse {
  statusCode: number;
  code: string;
  error: string;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>[] | null;
}

export interface EventRequest {
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  location?: Record<string, unknown>;
  isPublic?: boolean;
}

export interface EventRsvpRequest {
  status?: "GOING" | "INTERESTED" | "DECLINED";
}

export interface ExpenseCreateRequest {
  amount: number;
  category?: string;
  description: string;
  payment_method?: string;
  occurred_at: string;
  reference?: string | null;
}

export interface ExpenseResponse {
  id: string;
  church_id: string;
  created_by_user_id: string;
  amount: number;
  category: string;
  description: string;
  payment_method: string;
  occurred_at: string;
  status: string;
  reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceSummaryResponse {
  total_confirmed: number;
  total_pending: number;
  total_cancelled: number;
  total_platform_fee: number;
  total_church_amount: number;
  total_expenses?: number;
  net_balance?: number;
  period_start?: string | null;
  period_end?: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  reset_token?: string | null;
}

export type GlobalRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface GroupMessageRequest {
  content: string;
}

export interface GroupRequest {
  name: string;
  description?: string | null;
  isPublic?: boolean;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface LegalAcceptanceRequest {
  terms_version: string;
  privacy_version: string;
  purpose?: string;
}

export interface LegalDocumentResponse {
  key: "terms" | "privacy";
  version: string;
  title: string;
  url: string;
  effective_at: string;
}

export interface LegalDocumentsResponse {
  terms: LegalDocumentResponse;
  privacy: LegalDocumentResponse;
}

export interface LiveStartRequest {
  live_url: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutResponse {
  logged_out: boolean;
}

export interface ManualDonationRequest {
  amount: number;
  type?: string;
  campaign_id?: string | null;
  payer_name?: string | null;
  payer_email?: string | null;
  payer_cpf?: string | null;
  is_anonymous?: boolean;
  message?: string | null;
}

export type MembershipStatus = "PENDING" | "ACTIVE" | "INACTIVE";

export interface MyAssignmentResponse {
  assignment: ScheduleAssignmentResponse;
  slot: Record<string, unknown>;
  schedule: Record<string, unknown>;
  team: Record<string, unknown>;
}

export interface NotificationReadResponse {
  id: string;
  read: boolean;
}

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  body: string;
  image?: string | null;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsReadAllResponse {
  updated: number;
}

export interface PaginatedResponse_AuditLogResponse_ {
  data: AuditLogResponse[];
  meta: PaginationMeta;
}

export interface PaginatedResponse_CampaignResponse_ {
  data: CampaignResponse[];
  meta: PaginationMeta;
}

export interface PaginatedResponse_ChurchPublicationReviewResponse_ {
  data: ChurchPublicationReviewResponse[];
  meta: PaginationMeta;
}

export interface PaginatedResponse_DonationPublicStatusResponse_ {
  data: DonationPublicStatusResponse[];
  meta: PaginationMeta;
}

export interface PaginatedResponse_DonationStatusResponse_ {
  data: DonationStatusResponse[];
  meta: PaginationMeta;
}

export interface PaginatedResponse_ExpenseResponse_ {
  data: ExpenseResponse[];
  meta: PaginationMeta;
}

export interface PaginatedResponse_NotificationResponse_ {
  data: NotificationResponse[];
  meta: PaginationMeta;
}

export interface PaginatedResponse_PublicChurchResponse_ {
  data: PublicChurchResponse[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PanelAuthResponse {
  user: UserResponse;
  access_token: string;
  expires_in: number;
}

export interface PanelTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface PaymentWebhookResponse {
  received: boolean;
  provider: string;
  event: string;
  paymentId?: string | null;
  externalReference: string;
  donation: DonationWebhookStatusResponse;
}

export interface PeaceContentResponse {
  feeling: string;
  verses: PeaceVerseResponse[];
  devotional: PeaceDevotionalResponse;
  prayer: PeacePrayerResponse;
  prayerVariantIndex: number;
  prayerVariantCount: number;
  canShareWithCommunity: boolean;
  locale: string;
  contentVersion: string;
  safetyNote: string;
}

export interface PeaceDeleteResponse {
  id: string;
  deleted: boolean;
}

export interface PeaceDevotionalResponse {
  id: string;
  title: string;
  content: string;
  audioUrl?: string | null;
  duration: number;
}

export interface PeaceExportMomentResponse {
  id: string;
  feeling: string;
  sharedWithChurch?: string | null;
  message?: string | null;
  isAnonymous: boolean;
  devotionalCompleted: boolean;
  prayerCompleted: boolean;
  durationSeconds?: number | null;
  createdAt: string;
  devotionalId?: string | null;
  versesViewed?: PeaceVerseReferenceResponse[];
}

export interface PeaceExportResponse {
  exportedAt: string;
  retentionDays: number;
  moments: PeaceExportMomentResponse[];
}

export interface PeaceFeelingResponse {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface PeaceGeneratePrayerRequest {
  previousVariantIndex?: number;
}

export interface PeaceGeneratedPrayerResponse {
  feeling: string;
  variantIndex: number;
  totalVariants: number;
  prayer: PeacePrayerResponse;
}

export interface PeaceMomentResponse {
  id: string;
  feeling: string;
  sharedWithChurch?: string | null;
  message?: string | null;
  isAnonymous: boolean;
  devotionalCompleted: boolean;
  prayerCompleted: boolean;
  durationSeconds?: number | null;
  createdAt: string;
}

export interface PeacePrayerResponse {
  title: string;
  content: string;
}

export interface PeaceShareRequest {
  feelingId: string;
  churchId?: string | null;
  message?: string | null;
  isAnonymous?: boolean;
  devotionalCompleted?: boolean;
  prayerCompleted?: boolean;
  durationSeconds?: number | null;
}

export interface PeaceVerseReferenceResponse {
  reference: string;
  version: string;
}

export interface PeaceVerseResponse {
  reference: string;
  text: string;
  version: string;
}

export interface PostCommentCreateRequest {
  content: string;
}

export interface PostCreateRequest {
  content: string;
  attachments?: unknown[];
}

export interface PostModerateRequest {
  status: "PUBLISHED" | "HIDDEN" | "REMOVED";
}

export interface PostReportRequest {
  reason?: string | null;
}

export interface PrayerCommentRequest {
  content: string;
}

export interface ProcessPushReceiptsRequest {
  limit?: number;
  retryFailed?: boolean;
}

export interface ProcessPushReceiptsResponse {
  pendingTickets: number;
  receiptsChecked: number;
  notificationsUpdated: number;
  retryRequested: number;
  removedInvalidTokens: number;
  receipts: Record<string, unknown>;
  retryPush: Record<string, unknown>;
}

export interface PublicChurchResponse {
  id: string;
  name: string;
  slug: string;
  denomination: string;
  address: Record<string, unknown>;
  location: Record<string, unknown>;
  rating: number;
  rating_count: number;
  is_live: boolean;
  live_url?: string | null;
  live_started_at?: string | null;
  thumbnail?: string | null;
  member_count: number;
  plan: string;
  distance?: number | null;
}

export interface PublicationReviewRequest {
  status: ChurchPublicationStatus;
  reason?: string | null;
}

export interface PushHealthError {
  notification_id: string;
  ticket_id?: string | null;
  message: string;
  checked_at?: string | null;
}

export interface PushHealthReceipts {
  checked: number;
  pending: number;
  ok: number;
  error: number;
  last_checked_at?: string | null;
}

export interface PushHealthResponse {
  delivery_enabled: boolean;
  generated_at: string;
  users_with_tokens: number;
  total_tokens: number;
  invalid_tokens: number;
  notifications_scanned: number;
  tickets: PushHealthTickets;
  receipts: PushHealthReceipts;
  last_ticket_at?: string | null;
  recent_errors: PushHealthError[];
}

export interface PushHealthTickets {
  total: number;
  pending: number;
  ok: number;
  error: number;
}

export interface PushTokenResponse {
  registered?: boolean | null;
  unregistered?: boolean | null;
  tokensCount: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RegisterChurchAddressRequest {
  street: string;
  city: string;
  state: string;
  number?: string | null;
  neighborhood?: string | null;
  zip_code?: string | null;
}

export interface RegisterChurchContactRequest {
  email?: string | null;
  phone?: string | null;
}

export interface RegisterChurchLocationRequest {
  lat: number;
  lng: number;
}

export interface RegisterChurchMediaUploadResponse {
  purpose: string;
  key: string;
  url: string;
  content_type: string;
  size_bytes: number;
}

export interface RegisterChurchPayload {
  name: string;
  denomination: string;
  address: RegisterChurchAddressRequest;
  location: RegisterChurchLocationRequest;
  contact?: RegisterChurchContactRequest | null;
  description?: string | null;
  logo_url?: string | null;
  logo_key?: string | null;
  cover_url?: string | null;
  cover_key?: string | null;
}

export interface RegisterChurchRequest {
  user: RegisterChurchUserRequest;
  church: RegisterChurchPayload;
  legal_acceptance: LegalAcceptanceRequest;
}

export interface RegisterChurchUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface RegisterNotificationTokenRequest {
  token: string;
  platform: "android" | "ios" | "web";
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  legal_acceptance: LegalAcceptanceRequest;
}

export interface ReportResolveRequest {
  status: "REVIEWED" | "DISMISSED";
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  reset: boolean;
}

export interface ScheduleAssignmentResponse {
  id: string;
  team_member_id: string;
  response: "PENDING" | "CONFIRMED" | "DECLINED";
  response_note: string | null;
  responded_at: string | null;
  member_name: string;
  member_avatar: string | null;
}

export interface ScheduleCreateRequest {
  event_id?: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  location?: string | null;
  notes?: string | null;
  slots?: ScheduleSlotWrite[];
}

export interface ScheduleSlotResponse {
  id: string;
  label: string;
  position: number;
  capacity: number;
  assignments: ScheduleAssignmentResponse[];
}

export interface ScheduleSlotWrite {
  label: string;
  position: number;
  capacity?: number;
  team_member_ids?: string[];
}

export interface ScheduleUpdateRequest {
  event_id?: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  location?: string | null;
  notes?: string | null;
  slots?: ScheduleSlotWrite[];
  version: number;
}

export interface SendTestPushRequest {
  title?: string;
  body?: string;
}

export interface ServiceScheduleResponse {
  id: string;
  church_id: string;
  team_id: string;
  event_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  notes: string | null;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  published_at: string | null;
  created_by: string;
  version: number;
  created_at: string;
  slots: ScheduleSlotResponse[];
}

export type ServiceScheduleStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";

export interface TeamCreateRequest {
  name: string;
  type?: string;
  color?: string;
}

export interface TeamMemberCandidateResponse {
  church_member_id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  email: string | null;
}

export interface TeamMemberCreateRequest {
  church_member_id: string;
  role?: "LEADER" | "MEMBER";
  status?: "INVITED" | "ACTIVE" | "INACTIVE";
}

export interface TeamMemberPerson {
  id: string;
  name: string;
  avatar: string | null;
  email: string | null;
}

export interface TeamMemberResponse {
  id: string;
  team_id: string;
  church_member_id: string;
  user_id: string;
  role: "LEADER" | "MEMBER";
  status: "INVITED" | "ACTIVE" | "INACTIVE";
  user: TeamMemberPerson;
  created_at: string;
}

export interface TeamMemberUpdateRequest {
  role?: "LEADER" | "MEMBER" | null;
  status?: "INVITED" | "ACTIVE" | "INACTIVE" | null;
}

export interface TeamMembershipSummary {
  id: string;
  role: "LEADER" | "MEMBER";
  status: "INVITED" | "ACTIVE" | "INACTIVE";
}

export interface TeamResponse {
  id: string;
  church_id: string;
  name: string;
  type: string;
  color: string;
  status: "ACTIVE" | "ARCHIVED";
  created_by: string;
  created_at: string;
  membership?: TeamMembershipSummary | null;
  member_count?: number;
}

export interface TeamUpdateRequest {
  name?: string | null;
  type?: string | null;
  color?: string | null;
  status?: "ACTIVE" | "ARCHIVED" | null;
}

export interface TestPushResponse {
  notificationId: string;
  tokensCount: number;
  removedInvalidTokens: number;
  push: Record<string, unknown>;
}

export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in: number;
}

export interface TrackAnalyticsEventRequest {
  churchId?: string | null;
  eventType: "PUBLIC_MAP_VIEW" | "PUBLIC_CHURCH_VIEW" | "PUBLIC_CHURCH_CONTACT_CLICK" | "PUBLIC_CHURCH_APP_CLICK" | "PUBLIC_CHURCH_SHARE" | "MOBILE_MAP_VIEW" | "MOBILE_SEARCH_SUBMITTED" | "MOBILE_COMMUNITY_SELECTED" | "MOBILE_DIRECTIONS_OPENED" | "MOBILE_EVENT_OPENED" | "MOBILE_EVENT_DIRECTIONS_OPENED" | "MOBILE_EVENT_RSVP_UPDATED" | "MOBILE_EVENT_CALENDAR_OPENED" | "MOBILE_EVENT_REMINDER_SCHEDULED" | "MOBILE_DONATION_INITIATED" | "MOBILE_DONATION_PIX_COPIED" | "MOBILE_LIVE_OPENED" | "MOBILE_PEACE_OPENED" | "MOBILE_PEACE_FEELING_SELECTED" | "MOBILE_PEACE_CONTENT_COMPLETED" | "MOBILE_PEACE_PRAYER_GENERATED" | "MOBILE_PEACE_SOCIAL_SHARED" | "MOBILE_PEACE_SAVED" | "MOBILE_PEACE_ERROR";
  source: "WEB_DIRECTORY" | "WEB_DETAIL" | "WEB_LANDING" | "MOBILE_MAP" | "MOBILE_DETAIL" | "MOBILE_DEEP_LINK" | "MOBILE_EVENT_DETAIL" | "MOBILE_DONATION" | "MOBILE_PEACE";
  sessionId?: string | null;
  path?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateAvatarRequest {
  avatar_url: string;
}

export interface UpdateChurchRequest {
  name?: string | null;
  denomination?: string | null;
  description?: string | null;
  address?: ChurchAddressUpdateRequest | null;
  location?: ChurchLocationUpdateRequest | null;
  contact?: ChurchContactUpdateRequest | null;
  schedule?: unknown[] | null;
  pix_key?: string | null;
  donations_enabled?: boolean | null;
}

export interface UpdateComplianceStatusRequest {
  status: ComplianceStatus;
  resolution_summary?: string | null;
  assigned_to_user_id?: string | null;
}

export interface UpdateMeRequest {
  name?: string | null;
  phone?: string | null;
}

export interface UpdatePreferencesRequest {
  notifications?: Record<string, boolean> | null;
  notificationsByChurch?: Record<string, Record<string, boolean>> | null;
  language?: string | null;
  bibleVersion?: string | null;
}

export interface UserChurchResponse {
  member_id: string;
  church_id: string;
  role: ChurchRole;
  status: MembershipStatus;
  church: Record<string, unknown>;
  has_team_access?: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: GlobalRole;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}
