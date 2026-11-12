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

export interface AccountDeletionResponse {
  deleted: boolean;
  deleted_at: string;
  retained_categories: string[];
  message: string;
}

export interface AddComplianceNoteRequest {
  note: string;
  visibility?: ComplianceNoteVisibility;
}

export interface AdminProviderResponse {
  provider: "openai" | "anthropic" | null;
  version: number;
}

export interface AnnouncementRequest {
  title: string;
  content: string;
  is_pinned?: boolean;
  attachments?: unknown[];
}

export interface ApplyTaskTemplateRequest {
  template_id: "first_follow_up_v1" | "review_follow_up_v1";
  assigned_to_user_id: string;
  idempotency_key: string;
  confirmed: boolean;
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

export interface AvailableCarePersonReference {
  state: string;
  id: string;
  name: string;
}

export interface AvailableEventAttendancePersonReference {
  state: string;
  id: string;
  name: string;
}

export interface AvailablePersonReferenceResponse {
  state: string;
  id: string;
  name: string;
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

export type BusinessAuditAction = "MEMBERSHIP_ROLE_CHANGED" | "CHURCH_PUBLICATION_REVIEWED" | "MINISTRY_TEAM_CREATED" | "MINISTRY_TEAM_UPDATED" | "MINISTRY_TEAM_MEMBER_ADDED" | "MINISTRY_TEAM_MEMBER_UPDATED" | "SERVICE_SCHEDULE_CREATED" | "SERVICE_SCHEDULE_UPDATED" | "SERVICE_SCHEDULE_PUBLISHED" | "SERVICE_SCHEDULE_CANCELLED" | "MEMBERSHIP_STATUS_CHANGED" | "MEMBERSHIP_INVITED" | "MEMBERSHIP_INVITE_RESENT" | "MEMBERSHIP_JOINED" | "MEMBERSHIP_LEFT" | "PERSON_ACCESS_LINKED" | "PERSON_ACCESS_UNLINKED" | "COMMUNITY_EVENT_CREATED" | "COMMUNITY_EVENT_UPDATED" | "COMMUNITY_EVENT_DELETED" | "COMMUNITY_ANNOUNCEMENT_CREATED" | "COMMUNITY_ANNOUNCEMENT_UPDATED" | "COMMUNITY_ANNOUNCEMENT_DELETED" | "COMMUNITY_GROUP_CREATED" | "COMMUNITY_PRAYER_MARKED_ANSWERED" | "COMMUNITY_PRAYER_COMMENT_MODERATED" | "COMMUNITY_POST_REMOVED_BY_MODERATOR" | "COMMUNITY_POST_COMMENT_REMOVED_BY_MODERATOR" | "COMMUNITY_POST_MODERATION_STATUS_CHANGED" | "COMMUNITY_POST_REPORT_RESOLVED" | "COMMUNITY_GROUP_MESSAGE_MODERATED" | "CHURCH_SETTINGS_UPDATED" | "CHURCH_LIVE_STARTED" | "CHURCH_LIVE_RESTARTED" | "CHURCH_LIVE_STOPPED" | "PAYMENT_WEBHOOK_PROCESSED" | "PAYMENT_RECONCILIATED" | "CAMPAIGN_CREATED" | "CAMPAIGN_UPDATED" | "CAMPAIGN_CANCELLED" | "MANUAL_DONATION_CREATED" | "MANUAL_DONATION_CONFIRMED" | "DONATION_CANCELLED" | "DONATION_REFUND_REQUESTED" | "EXPENSE_CREATED" | "EXPENSE_CANCELLED";

export interface BusinessAuditEventResponse {
  id: string;
  action: BusinessAuditAction;
  family: "ORGANIZATION" | "FINANCE";
  target_type: string;
  target_id?: string | null;
  outcome: string;
  actor_user_id?: string | null;
  occurred_at: string;
  summary?: Record<string, unknown>;
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

export interface Capabilities {
  can_create: boolean;
  is_responsible: boolean;
  has_local_admin: boolean;
}

export interface CareRequestListResponse {
  data: CareRequestResponse[];
  meta: PaginationMeta;
}

export interface CareRequestResponse {
  id: string;
  person: AvailableCarePersonReference | UnavailableCarePersonReference;
  responsible_user_id: string;
  status: CareRequestStatus;
  version: number;
  created_at: string | null;
  closed_at: string | null;
}

export type CareRequestStatus = "OPEN" | "CLOSED";

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
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;
}

export interface ChurchLocationUpdateRequest {
  lat: number;
  lng: number;
}

export interface ChurchPhotoRequest {
  type: "logo" | "cover" | "gallery";
  url: string;
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
  features?: string[];
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
  features?: string[];
}

export type ChurchRole = "MEMBER" | "CHURCH_MODERATOR" | "CHURCH_FINANCE" | "CHURCH_ADMIN";

export interface ChurchScheduleEntryRequest {
  title: string;
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  time: string;
  description?: string | null;
}

export interface CloseCareRequestRequest {
  expected_version: number;
}

export type ComplianceCategory = "HARASSMENT" | "ABUSE" | "DISCRIMINATION" | "FINANCIAL_IRREGULARITY" | "SPIRITUAL_ABUSE" | "DATA_PRIVACY" | "OTHER";

export type ComplianceNoteVisibility = "INTERNAL" | "PUBLIC_REPORTER";

export type ComplianceSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ComplianceStatus = "RECEIVED" | "TRIAGED" | "IN_REVIEW" | "ACTION_TAKEN" | "DISMISSED" | "CLOSED" | "ESCALATED";

export type ComplianceTargetType = "ANNOUNCEMENT" | "PRAYER" | "EVENT" | "GROUP" | "MEMBER" | "CHURCH" | "OTHER";

export interface ConfirmPayload {
  mode: "LINK" | "CREATE";
  person_id?: string | null;
  classification?: "PERSON" | "VISITOR" | null;
}

export interface CreateCareRequestRequest {
  person_id: string;
  idempotency_key: string;
}

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

export interface CreateNetwork {
  name: string;
  responsible_email: string;
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
  finances?: Record<string, unknown> | null;
  engagement: Record<string, unknown>;
  operational: Record<string, unknown>;
}

export interface DataResponse_AccountDeletionResponse_ {
  data: AccountDeletionResponse;
  message?: string | null;
}

export interface DataResponse_AuthResponse_ {
  data: AuthResponse;
  message?: string | null;
}

export interface DataResponse_CampaignResponse_ {
  data: CampaignResponse;
  message?: string | null;
}

export interface DataResponse_CareRequestResponse_ {
  data: CareRequestResponse;
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

export interface DataResponse_EventAttendanceOccurrenceResponse_ {
  data: EventAttendanceOccurrenceResponse;
  message?: string | null;
}

export interface DataResponse_EventAttendancePersonResponse_ {
  data: EventAttendancePersonResponse;
  message?: string | null;
}

export interface DataResponse_EventDetailResponse_ {
  data: EventDetailResponse;
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

export interface DataResponse_GroupAdministrationResponse_ {
  data: GroupAdministrationResponse;
  message?: string | null;
}

export interface DataResponse_GroupDetailResponse_ {
  data: GroupDetailResponse;
  message?: string | null;
}

export interface DataResponse_GroupPersonParticipationResponse_ {
  data: GroupPersonParticipationResponse;
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

export interface DataResponse_PeopleImportBatchDetailResponse_ {
  data: PeopleImportBatchDetailResponse;
  message?: string | null;
}

export interface DataResponse_PeopleImportConfirmationResponse_ {
  data: PeopleImportConfirmationResponse;
  message?: string | null;
}

export interface DataResponse_PeopleImportPreviewResponse_ {
  data: PeopleImportPreviewResponse;
  message?: string | null;
}

export interface DataResponse_PeopleImportReversalPreviewResponse_ {
  data: PeopleImportReversalPreviewResponse;
  message?: string | null;
}

export interface DataResponse_PeopleImportReversalResponse_ {
  data: PeopleImportReversalResponse;
  message?: string | null;
}

export interface DataResponse_PersonFollowUpTaskResponse_ {
  data: PersonFollowUpTaskResponse;
  message?: string | null;
}

export interface DataResponse_PersonJourneyResponse_ {
  data: PersonJourneyResponse;
  message?: string | null;
}

export interface DataResponse_PersonRelationshipResponse_ {
  data: PersonRelationshipResponse;
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

export interface DataResponse_WhatsAppConsentEventResponse_ {
  data: WhatsAppConsentEventResponse;
  message?: string | null;
}

export interface DataResponse_WhatsAppConsentStateResponse_ {
  data: WhatsAppConsentStateResponse;
  message?: string | null;
}

export interface DataResponse_WhatsAppSessionBindingResponse_ {
  data: WhatsAppSessionBindingResponse;
  message?: string | null;
}

export interface DataResponse_WhatsAppStatusResponse_ {
  data: WhatsAppStatusResponse;
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

export interface DeleteAccountRequest {
  confirmation: string;
  current_password: string;
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

export interface ErrorDetail_Literal__CONFLICT___ {
  code: string;
}

export interface ErrorDetail_Literal__FORBIDDEN___ {
  code: string;
}

export interface ErrorDetail_Literal__INVALID_INPUT___ {
  code: string;
}

export interface ErrorDetail_Literal__INVALID_SELECTION___ {
  code: string;
}

export interface ErrorDetail_Literal__NOT_FOUND___ {
  code: string;
}

export interface ErrorDetail_Literal__PAYLOAD_TOO_LARGE___ {
  code: string;
}

export interface ErrorDetail_Literal__PERSISTENCE_UNAVAILABLE___ {
  code: string;
}

export interface ErrorDetail_Literal__UNAUTHENTICATED___ {
  code: string;
}

export interface ErrorDetail_Literal__UNAVAILABLE___ {
  code: string;
}

export interface ErrorDetail_Literal__VERSION_CONFLICT___ {
  code: string;
}

export interface ErrorResponse {
  statusCode: number;
  code: string;
  error: string;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>[] | null;
}

export interface ErrorResponse_Literal__CONFLICT___ {
  detail: ErrorDetail_Literal__CONFLICT___;
}

export interface ErrorResponse_Literal__FORBIDDEN___ {
  detail: ErrorDetail_Literal__FORBIDDEN___;
}

export interface ErrorResponse_Literal__INVALID_INPUT___ {
  detail: ErrorDetail_Literal__INVALID_INPUT___;
}

export interface ErrorResponse_Literal__INVALID_SELECTION___ {
  detail: ErrorDetail_Literal__INVALID_SELECTION___;
}

export interface ErrorResponse_Literal__NOT_FOUND___ {
  detail: ErrorDetail_Literal__NOT_FOUND___;
}

export interface ErrorResponse_Literal__PAYLOAD_TOO_LARGE___ {
  detail: ErrorDetail_Literal__PAYLOAD_TOO_LARGE___;
}

export interface ErrorResponse_Literal__PERSISTENCE_UNAVAILABLE___ {
  detail: ErrorDetail_Literal__PERSISTENCE_UNAVAILABLE___;
}

export interface ErrorResponse_Literal__UNAUTHENTICATED___ {
  detail: ErrorDetail_Literal__UNAUTHENTICATED___;
}

export interface ErrorResponse_Literal__UNAVAILABLE___ {
  detail: ErrorDetail_Literal__UNAVAILABLE___;
}

export interface ErrorResponse_Literal__VERSION_CONFLICT___ {
  detail: ErrorDetail_Literal__VERSION_CONFLICT___;
}

export interface EventAttendanceCloseRequest {
  expected_version: number;
}

export interface EventAttendanceListResponse {
  data: EventAttendanceOccurrenceResponse[];
  meta: PaginationMeta;
}

export interface EventAttendanceOccurrenceResponse {
  id: string;
  church_id: string;
  event_id: string;
  event_available: boolean;
  state: "OPEN" | "CLOSED";
  version: number;
  started_at: string;
  ended_at: string | null;
  opened_at: string;
  opened_by_user_id?: string | null;
  closed_at: string | null;
  closed_by_user_id?: string | null;
}

export interface EventAttendanceOpenRequest {
  idempotency_key: string;
}

export interface EventAttendancePeopleListResponse {
  data: EventAttendancePersonResponse[];
  meta: PaginationMeta;
}

export interface EventAttendancePersonCorrectionRequest {
  state: "PRESENT" | "INVALIDATED";
  expected_version: number;
}

export interface EventAttendancePersonMarkRequest {
  expected_version?: number | null;
}

export interface EventAttendancePersonResponse {
  id: string;
  person: AvailableEventAttendancePersonReference | UnavailableEventAttendancePersonReference;
  state: "PRESENT" | "INVALIDATED";
  version: number;
}

export interface EventAttendancePersonSelectorItemResponse {
  id: string;
  name: string;
}

export interface EventAttendancePersonSelectorResponse {
  data: EventAttendancePersonSelectorItemResponse[];
  meta: PaginationMeta;
}

export interface EventDetailResponse {
  id: string;
  church_id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: Record<string, unknown>;
  is_public: boolean;
  created_at: string;
  church_name: string;
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

export interface EventView {
  action: "REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED" | "ENDED";
  version: number;
  occurred_at: string;
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

export interface FinancialMovementResponse {
  kind: "income" | "expense";
  id: string;
  movement_at: string;
  date_basis: "created_at" | "occurred_at";
  amount: number;
  status: string;
  payment_method?: string | null;
  gateway_provider?: string | null;
  label?: string | null;
  description?: string | null;
  church_amount?: number | null;
  platform_fee?: number | null;
  confirmed_at?: string | null;
  campaign_id?: string | null;
}

export interface FinancialMovementsMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  period_start?: string | null;
  period_end?: string | null;
  summary: FinanceSummaryResponse;
}

export interface FinancialMovementsPage {
  data: FinancialMovementResponse[];
  meta: FinancialMovementsMeta;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  reset_token?: string | null;
  delivery: "not_configured" | "unconfirmed";
}

export type GlobalRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface GroupAdministrationAssigneeResponse {
  id: string;
  name: string;
}

export interface GroupAdministrationAssigneesResponse {
  data: GroupAdministrationAssigneeResponse[];
  meta: PaginationMeta;
}

export interface GroupAdministrationCloseRequest {
  expected_version: number;
}

export interface GroupAdministrationCreateRequest {
  name: string;
  description?: string | null;
  is_public?: boolean;
  responsible_user_id?: string | null;
  schedule?: GroupAdministrationScheduleRequest | null;
  location?: string | null;
  idempotency_key: string;
}

export interface GroupAdministrationListResponse {
  data: GroupAdministrationResponse[];
  meta: PaginationMeta;
}

export interface GroupAdministrationResponse {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  member_count: number;
  status: "ACTIVE" | "CLOSED";
  version: number;
  responsible: GroupAdministrationResponsibleResponse | null;
  responsibility_status: "ACTIVE" | "PENDING";
  schedule: GroupAdministrationScheduleResponse | null;
  location: string | null;
  created_at: string;
  closed_at: string | null;
}

export interface GroupAdministrationResponsibleResponse {
  user_id: string;
  display_name: string | null;
  status: "ACTIVE" | "PENDING";
}

export interface GroupAdministrationScheduleRequest {
  day: number;
  time: string;
  timezone: string;
}

export interface GroupAdministrationScheduleResponse {
  day: number;
  time: string;
  timezone: string;
}

export interface GroupAdministrationUpdateRequest {
  expected_version: number;
  name: string;
  description?: string | null;
  is_public: boolean;
  responsible_user_id: string;
  schedule?: GroupAdministrationScheduleRequest | null;
  location?: string | null;
}

export interface GroupDetailResponse {
  id: string;
  church_id: string;
  created_by: string;
  name: string;
  description: string | null;
  is_public: boolean;
  member_count: number;
  created_at: string;
  membership_role: string;
}

export interface GroupMessageRequest {
  content: string;
}

export interface GroupPersonJoinRequest {
  person_id: string;
  expected_version?: number | null;
}

export interface GroupPersonLeaveRequest {
  expected_version: number;
}

export interface GroupPersonParticipationListResponse {
  data: GroupPersonParticipationResponse[];
  meta: PaginationMeta;
}

export interface GroupPersonParticipationResponse {
  id: string;
  person: AvailablePersonReferenceResponse | UnavailablePersonReferenceResponse;
  status: "ACTIVE" | "LEFT";
  version: number;
}

export interface GroupPersonSelectorItemResponse {
  id: string;
  name: string;
}

export interface GroupPersonSelectorResponse {
  data: GroupPersonSelectorItemResponse[];
  meta: PaginationMeta;
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
  status: "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED";
}

export interface LegalDocumentsResponse {
  terms: LegalDocumentResponse;
  privacy: LegalDocumentResponse;
}

export interface LinkBase {
  id: string;
  network_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "ENDED";
  version: number;
  created_at: string;
  updated_at: string;
}

export interface LiveStartRequest {
  live_url: string;
}

export interface LocalLink {
  id: string;
  network_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "ENDED";
  version: number;
  created_at: string;
  updated_at: string;
  network_name: string | null;
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

export type MessageHistoryState = "reserved" | "accepted" | "unknown" | "rejected" | "pending" | "server" | "delivered" | "read" | "played" | "failed";

export interface MyAssignmentResponse {
  assignment: ScheduleAssignmentResponse;
  slot: Record<string, unknown>;
  schedule: Record<string, unknown>;
  team: Record<string, unknown>;
}

export interface MyPersonFollowUpTasksResponse {
  data: PersonFollowUpTaskResponse[];
  meta: PaginationMeta;
}

export interface NetworkCreated {
  id: string;
  name: string;
}

export interface NetworkSummary {
  id: string;
  name: string;
  is_responsible: boolean;
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

export type OperationalAuditAction = "person.created" | "person.updated" | "person.journey.changed" | "person.task.created" | "person.task.completed" | "person.task.cancelled" | "group.person_participation.joined" | "group.person_participation.rejoined" | "group.person_participation.left" | "event.attendance.person.marked" | "event.attendance.person.restored" | "event.attendance.person.invalidated" | "group.administration.created" | "group.administration.updated" | "group.administration.closed" | "event.attendance.opened" | "event.attendance.closed";

export interface OperationalAuditEventResponse {
  id: string;
  action: OperationalAuditAction;
  family: "REGISTRATION" | "FOLLOW_UP" | "GROUP" | "ATTENDANCE";
  target_type: "person" | "person_follow_up_task" | "group_person_participation" | "event_attendance_person" | "group" | "event_attendance_occurrence";
  target_id: string | null;
  outcome: string;
  actor_user_id: string | null;
  occurred_at: string;
  changed_fields: ("name" | "classification" | "email" | "phone")[];
}

export interface OwnedLink {
  id: string;
  network_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "ENDED";
  version: number;
  created_at: string;
  updated_at: string;
  requested_ref: string | null;
  church_name: string | null;
}

export interface Page_EventView_ {
  items: EventView[];
  next_cursor: string | null;
}

export interface Page_LocalLink_ {
  items: LocalLink[];
  next_cursor: string | null;
}

export interface Page_NetworkSummary_ {
  items: NetworkSummary[];
  next_cursor: string | null;
}

export interface Page_Union_OwnedLink__PeerLink__ {
  items: (OwnedLink | PeerLink)[];
  next_cursor: string | null;
}

export interface PaginatedResponse_AuditLogResponse_ {
  data: AuditLogResponse[];
  meta: PaginationMeta;
}

export interface PaginatedResponse_BusinessAuditEventResponse_ {
  data: BusinessAuditEventResponse[];
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

export interface PaginatedResponse_OperationalAuditEventResponse_ {
  data: OperationalAuditEventResponse[];
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
  retentionBasis: string;
  retainedWhileAccountActive: boolean;
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

export interface PeerLink {
  church_name: string;
}

export interface PeopleAttendanceReportResponse {
  data: PeopleAttendanceReportRow[];
  meta: PaginationMeta;
  summary: PeopleAttendanceReportSummary;
}

export interface PeopleAttendanceReportRow {
  id: string;
  name: string;
  classification: PersonClassification;
  presence_count: number;
  last_present_at: string | null;
}

export interface PeopleAttendanceReportSummary {
  people_total: number;
  people_with_presence: number;
  presences_total: number;
}

export interface PeopleImportBatchDetailResponse {
  batch_id: string;
  status: string;
  confirmed_at: string;
  reversed_at: string | null;
  counts: PeopleImportConfirmationCounts;
  rows: PeopleImportBatchRowResponse[];
}

export interface PeopleImportBatchRowResponse {
  line_number: number;
  status: string;
  person_id: string | null;
  error_codes: string[];
}

export interface PeopleImportConfirmationCounts {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  created_rows: number;
  skipped_rows: number;
}

export interface PeopleImportConfirmationResponse {
  batch_id: string;
  status: string;
  confirmed_at: string;
  counts: PeopleImportConfirmationCounts;
}

export interface PeopleImportInternalDuplicateGroup {
  group_id: number;
  lines: number[];
  matched_fields: ("name" | "email" | "phone")[];
}

export interface PeopleImportPreviewCounts {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  empty_rows_ignored: number;
}

export interface PeopleImportPreviewFieldError {
  field: string;
  code: string;
}

export interface PeopleImportPreviewResponse {
  preview_id: string;
  token: string;
  expires_at: string;
  counts: PeopleImportPreviewCounts;
  rows: PeopleImportPreviewRow[];
  internal_duplicate_groups: PeopleImportInternalDuplicateGroup[];
}

export interface PeopleImportPreviewRow {
  line_number: number;
  normalized_values: PersonCreateRequest | null;
  errors: PeopleImportPreviewFieldError[];
  internal_duplicate_group_ids: number[];
  candidates: PersonCandidateResponse[];
}

export interface PeopleImportReversalConflict {
  line_number: number | null;
  code: string;
}

export interface PeopleImportReversalPreviewResponse {
  batch_id: string;
  status: string;
  imported_rows: number;
  conflicted_rows: number;
  eligible: boolean;
  conflicts: PeopleImportReversalConflict[];
  token: string | null;
  expires_at: string | null;
}

export interface PeopleImportReversalRequest {
  token: string;
}

export interface PeopleImportReversalResponse {
  batch_id: string;
  status: string;
  reversed_at: string;
  reversed_rows: number;
}

export interface PersonAccessGrantData {
  id: string;
  church_id: string;
  user_id: string;
  role: ChurchRole;
  status: MembershipStatus;
  reset_token: string | null;
  delivery: "not_configured" | "unconfirmed" | "accepted" | "failed" | "not_sent";
  person_id: string;
  person_link: string;
}

export interface PersonAccessGrantRequest {
  role: ChurchRole;
  email?: string | null;
}

export interface PersonAccessGrantResponse {
  data: PersonAccessGrantData;
  message?: string | null;
}

export interface PersonAccessResponse {
  member_id: string;
  user_id: string;
  role: ChurchRole;
  status: MembershipStatus;
}

export interface PersonCandidateResponse {
  id: string;
  name: string;
  classification: PersonClassification;
  matched_fields: ("name" | "email" | "phone")[];
}

export type PersonClassification = "PERSON" | "VISITOR";

export interface PersonCreateRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  classification: PersonClassification;
}

export interface PersonDetailResponse {
  data: PersonResponse;
  message?: string | null;
}

export interface PersonDuplicateRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  exclude_id?: string | null;
}

export interface PersonDuplicatesResponse {
  data: PersonCandidateResponse[];
  message?: string | null;
}

export interface PersonFollowUpAssigneeResponse {
  id: string;
  name: string;
}

export interface PersonFollowUpAssigneesResponse {
  data: PersonFollowUpAssigneeResponse[];
  meta: PaginationMeta;
}

export type PersonFollowUpHistoryAction = "person.journey.changed" | "person.task.created" | "person.task.completed" | "person.task.cancelled";

export interface PersonFollowUpHistoryEventResponse {
  id: string;
  action: PersonFollowUpHistoryAction;
  church_id: string;
  person_id: string;
  task_id?: string | null;
  actor_user_id?: string | null;
  created_at: string;
  version: number;
  from_stage?: PersonJourneyStage | null;
  to_stage?: PersonJourneyStage | null;
  from_status?: PersonFollowUpTaskStatus | null;
  to_status?: PersonFollowUpTaskStatus | null;
}

export interface PersonFollowUpHistoryResponse {
  data: PersonFollowUpHistoryEventResponse[];
  meta: PaginationMeta;
  person_active: boolean;
}

export interface PersonFollowUpTaskCreateRequest {
  title: string;
  assigned_to_user_id: string;
  due_at?: string | null;
  idempotency_key: string;
}

export interface PersonFollowUpTaskResponse {
  id: string;
  person_id: string;
  title: string;
  status: PersonFollowUpTaskStatus;
  assigned_to_user_id?: string | null;
  assignee_name?: string | null;
  assignee_eligible: boolean;
  due_at: string | null;
  version: number;
  created_at: string;
  terminal_at: string | null;
  person_active: boolean;
}

export type PersonFollowUpTaskStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export type PersonFollowUpTaskTerminalStatus = "COMPLETED" | "CANCELLED";

export interface PersonFollowUpTaskTransitionRequest {
  status: PersonFollowUpTaskTerminalStatus;
  expected_version: number;
}

export interface PersonFollowUpTasksResponse {
  data: PersonFollowUpTaskResponse[];
  meta: PaginationMeta;
  person_active: boolean;
}

export interface PersonGroupLink {
  group_id: string;
  group_name: string;
  person_id: string;
  person_name: string;
}

export interface PersonGroupLinksMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PersonGroupLinksResponse {
  data: PersonGroupLink[];
  meta: PersonGroupLinksMeta;
}

export interface PersonHistoryEntryResponse {
  id: string;
  action: "person.created" | "person.updated";
  created_at: string;
  actor_user_id?: string | null;
  changed_fields: ("name" | "classification" | "email" | "phone")[];
}

export interface PersonHistoryMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PersonHistoryResponse {
  data: PersonHistoryEntryResponse[];
  meta: PersonHistoryMeta;
}

export interface PersonJourneyResponse {
  person_id: string;
  stage: PersonJourneyStage;
  version: number;
}

export type PersonJourneyStage = "NOT_STARTED" | "FOLLOW_UP" | "CLOSED";

export interface PersonJourneyUpdateRequest {
  stage: PersonJourneyStage;
  expected_version: number;
}

export interface PersonListMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PersonListResponse {
  data: PersonResponse[];
  meta: PersonListMeta;
}

export interface PersonRelationshipCandidateListResponse {
  data: PersonRelationshipCandidateResponse[];
}

export interface PersonRelationshipCandidateResponse {
  id: string;
  name: string;
}

export interface PersonRelationshipCreateRequest {
  source_person_id: string;
  target_person_id: string;
  type: PersonRelationshipType;
}

export interface PersonRelationshipEndEnvelope {
  data: PersonRelationshipEndResponse;
}

export interface PersonRelationshipEndResponse {
  id: string;
  ended_at: string;
}

export interface PersonRelationshipListResponse {
  data: PersonRelationshipResponse[];
}

export interface PersonRelationshipResponse {
  id: string;
  source_person_id: string;
  source_person_name: string;
  target_person_id: string;
  target_person_name: string;
  type: PersonRelationshipType;
  origin: string;
  visibility: string;
  created_by_user_id: string;
  created_at: string;
  ended_at: string | null;
}

export type PersonRelationshipType = "RESPONSIBLE_FOR" | "MENTORS" | "LEADS";

export interface PersonResponse {
  id: string;
  church_id: string;
  name: string;
  classification: PersonClassification;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  access: PersonAccessResponse | null;
}

export interface PersonTimelineEntryResponse {
  id: string;
  action: "person.created" | "person.updated" | "person.journey.changed" | "person.task.created" | "person.task.completed" | "person.task.cancelled" | "group.person_participation.joined" | "group.person_participation.rejoined" | "group.person_participation.left" | "event.attendance.person.marked" | "event.attendance.person.restored" | "event.attendance.person.invalidated";
  family: "REGISTRATION" | "FOLLOW_UP" | "GROUP" | "ATTENDANCE";
  created_at: string;
  actor_user_id?: string | null;
  changed_fields: ("name" | "classification" | "email" | "phone")[];
}

export interface PersonTimelineMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PersonTimelineResponse {
  data: PersonTimelineEntryResponse[];
  meta: PersonTimelineMeta;
}

export interface PersonUpdateRequest {
  name: string;
  email: string | null;
  phone: string | null;
  classification: PersonClassification;
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

export interface ProviderSelectionRequest {
  provider: "openai" | "anthropic" | null;
  expected_version: number;
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

export interface PublicProviderResponse {
  provider: "openai" | "anthropic" | null;
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

export interface RegisterPayload {
  consent: boolean;
  name: string;
  contact_kind: "email" | "phone";
  contact_value: string;
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

export interface RequestLink {
  church_ref: string;
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

export interface TaskTemplateCatalogResponse {
  data: TaskTemplateView[];
}

export interface TaskTemplateIntentResponse {
  data: TaskTemplateIntentView;
}

export interface TaskTemplateIntentView {
  id: string;
  template_id: "first_follow_up_v1" | "review_follow_up_v1";
  status: "QUEUED" | "COMPLETED" | "FAILED";
  task_id: string | null;
}

export interface TaskTemplateView {
  id: string;
  version: number;
  task_title: string;
}

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

export interface TransitionLink {
  expected_version: number;
}

export interface UnavailableCarePersonReference {
  state: string;
  id: string;
}

export interface UnavailableEventAttendancePersonReference {
  state: string;
  id: string;
}

export interface UnavailablePersonReferenceResponse {
  state: string;
  id: string;
}

export interface UniversalSearchResponse {
  data: UniversalSearchResult[];
}

export interface UniversalSearchResult {
  kind: "person" | "group";
  id: string;
  label: string;
  path: string;
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
  schedule?: ChurchScheduleEntryRequest[] | null;
  pix_key?: string | null;
  donations_enabled?: boolean | null;
  features?: string[] | null;
  thumbnail?: string | null;
  photos?: ChurchPhotoRequest[] | null;
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

export interface WhatsAppBindingStatus {
  state: "UNBOUND" | "ACTIVE" | "INACTIVE";
  session_id?: string | null;
  version: number;
  updated_at: string | null;
}

export type WhatsAppConsentAction = "opt_in" | "opt_out";

export interface WhatsAppConsentCreateRequest {
  action: WhatsAppConsentAction;
  chat_id: string;
  explicit_confirmation: boolean;
  expected_version: number;
  idempotency_key: string;
}

export interface WhatsAppConsentEventResponse {
  id: string;
  person_id: string;
  chat_id: string;
  action: WhatsAppConsentAction;
  version: number;
  operator_user_id: string;
  occurred_at: string;
}

export interface WhatsAppConsentEventsResponse {
  data: WhatsAppConsentEventResponse[];
  meta: PaginationMeta;
}

export interface WhatsAppConsentStateResponse {
  person_id: string;
  chat_id: string;
  action: WhatsAppConsentAction | null;
  version: number;
  operator_user_id?: string | null;
  occurred_at: string | null;
}

export interface WhatsAppHealthStatus {
  status?: string;
  reason?: string;
  checked_at?: null;
}

export interface WhatsAppMessageHistoryResponse {
  id: string;
  person_id: string;
  operator_user_id: string;
  session_id: string;
  state: MessageHistoryState;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessagesResponse {
  data: WhatsAppMessageHistoryResponse[];
  meta: PaginationMeta;
}

export interface WhatsAppRuntimeStatus {
  enabled?: boolean;
  send_enabled?: boolean;
}

export interface WhatsAppSessionBindingResponse {
  church_id: string;
  session_id?: string | null;
  active: boolean;
  version: number;
  operator_user_id?: string | null;
  updated_at: string | null;
}

export interface WhatsAppStatusResponse {
  church_id: string;
  binding: WhatsAppBindingStatus;
  runtime: WhatsAppRuntimeStatus;
  health: WhatsAppHealthStatus;
}
