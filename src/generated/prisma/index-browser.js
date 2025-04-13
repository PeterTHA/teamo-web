
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  emailVerified: 'emailVerified',
  password: 'password',
  image: 'image',
  role: 'role',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  lastLogin: 'lastLogin'
};

exports.Prisma.WorkspaceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  logo: 'logo',
  address: 'address',
  taxId: 'taxId',
  phone: 'phone',
  email: 'email',
  contactPerson: 'contactPerson',
  status: 'status',
  planType: 'planType',
  subscriptionStart: 'subscriptionStart',
  subscriptionEnd: 'subscriptionEnd',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkspaceMemberScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  userId: 'userId',
  role: 'role',
  joinedAt: 'joinedAt',
  invitedBy: 'invitedBy',
  status: 'status'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  name: 'name',
  code: 'code',
  description: 'description',
  managerId: 'managerId',
  parentId: 'parentId',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TeamScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  departmentId: 'departmentId',
  name: 'name',
  description: 'description',
  leaderId: 'leaderId',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PositionScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  name: 'name',
  code: 'code',
  description: 'description',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PositionLevelScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  name: 'name',
  level: 'level',
  description: 'description',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  userId: 'userId',
  employeeCode: 'employeeCode',
  firstName: 'firstName',
  lastName: 'lastName',
  thaiFirstName: 'thaiFirstName',
  thaiLastName: 'thaiLastName',
  nickname: 'nickname',
  email: 'email',
  phone: 'phone',
  emergencyContact: 'emergencyContact',
  birthdate: 'birthdate',
  gender: 'gender',
  nationalId: 'nationalId',
  nationalIdIv: 'nationalIdIv',
  passportNumber: 'passportNumber',
  passportNumberIv: 'passportNumberIv',
  address: 'address',
  taxId: 'taxId',
  bankAccount: 'bankAccount',
  bankAccountIv: 'bankAccountIv',
  bankName: 'bankName',
  hireDate: 'hireDate',
  probationEndDate: 'probationEndDate',
  resignDate: 'resignDate',
  departmentId: 'departmentId',
  teamId: 'teamId',
  positionId: 'positionId',
  positionLevelId: 'positionLevelId',
  managerId: 'managerId',
  status: 'status',
  employmentType: 'employmentType',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmploymentHistoryScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  positionId: 'positionId',
  positionLevelId: 'positionLevelId',
  departmentId: 'departmentId',
  startDate: 'startDate',
  endDate: 'endDate',
  salary: 'salary',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmployeeDocumentScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  type: 'type',
  name: 'name',
  filename: 'filename',
  mimeType: 'mimeType',
  size: 'size',
  url: 'url',
  uploadedBy: 'uploadedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  name: 'name',
  code: 'code',
  description: 'description',
  startDate: 'startDate',
  endDate: 'endDate',
  budget: 'budget',
  status: 'status',
  priority: 'priority',
  managerId: 'managerId',
  clientName: 'clientName',
  clientContact: 'clientContact',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProjectMemberScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  employeeId: 'employeeId',
  roleId: 'roleId',
  allocation: 'allocation',
  startDate: 'startDate',
  endDate: 'endDate'
};

exports.Prisma.ProjectRoleScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveTypeScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  name: 'name',
  code: 'code',
  description: 'description',
  color: 'color',
  isPaid: 'isPaid',
  requiresApproval: 'requiresApproval',
  requiresAttachment: 'requiresAttachment',
  maxDaysPerYear: 'maxDaysPerYear',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveQuotaScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  employeeId: 'employeeId',
  leaveTypeId: 'leaveTypeId',
  year: 'year',
  total: 'total',
  used: 'used',
  pending: 'pending',
  remaining: 'remaining',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeaveScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  employeeId: 'employeeId',
  leaveTypeId: 'leaveTypeId',
  startDate: 'startDate',
  endDate: 'endDate',
  halfDay: 'halfDay',
  duration: 'duration',
  reason: 'reason',
  attachment: 'attachment',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OvertimePolicyScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  name: 'name',
  description: 'description',
  rate: 'rate',
  minimumHours: 'minimumHours',
  maximumHours: 'maximumHours',
  requiresApproval: 'requiresApproval',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OvertimeScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  employeeId: 'employeeId',
  policyId: 'policyId',
  date: 'date',
  startTime: 'startTime',
  endTime: 'endTime',
  hours: 'hours',
  reason: 'reason',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApprovalTemplateScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  name: 'name',
  description: 'description',
  entityType: 'entityType',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApprovalStepScalarFieldEnum = {
  id: 'id',
  approvalTemplateId: 'approvalTemplateId',
  stepNumber: 'stepNumber',
  approverType: 'approverType',
  approverId: 'approverId',
  backup1Id: 'backup1Id',
  backup2Id: 'backup2Id',
  timeLimit: 'timeLimit'
};

exports.Prisma.ApprovalScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  templateId: 'templateId',
  entityType: 'entityType',
  entityId: 'entityId',
  requesterId: 'requesterId',
  currentStep: 'currentStep',
  status: 'status',
  leaveId: 'leaveId',
  overtimeId: 'overtimeId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApprovalActionScalarFieldEnum = {
  id: 'id',
  approvalId: 'approvalId',
  userId: 'userId',
  step: 'step',
  action: 'action',
  comment: 'comment',
  createdAt: 'createdAt'
};

exports.Prisma.SettingsScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  category: 'category',
  key: 'key',
  value: 'value',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserConsentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  purpose: 'purpose',
  consentGiven: 'consentGiven',
  timestamp: 'timestamp',
  ipAddress: 'ipAddress'
};

exports.Prisma.ActivityLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  userId: 'userId',
  action: 'action',
  resource: 'resource',
  resourceId: 'resourceId',
  details: 'details',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.InvitationScalarFieldEnum = {
  id: 'id',
  workspaceId: 'workspaceId',
  email: 'email',
  code: 'code',
  type: 'type',
  status: 'status',
  data: 'data',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.UserRole = exports.$Enums.UserRole = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER'
};

exports.UserStatus = exports.$Enums.UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING'
};

exports.WorkspaceStatus = exports.$Enums.WorkspaceStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
};

exports.PlanType = exports.$Enums.PlanType = {
  FREE: 'FREE',
  BASIC: 'BASIC',
  PREMIUM: 'PREMIUM',
  ENTERPRISE: 'ENTERPRISE'
};

exports.MemberRole = exports.$Enums.MemberRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER'
};

exports.MemberStatus = exports.$Enums.MemberStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING'
};

exports.EmployeeStatus = exports.$Enums.EmployeeStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PROBATION: 'PROBATION',
  TERMINATED: 'TERMINATED',
  RESIGNED: 'RESIGNED',
  PENDING: 'PENDING'
};

exports.EmploymentType = exports.$Enums.EmploymentType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
  INTERN: 'INTERN',
  FREELANCE: 'FREELANCE'
};

exports.ProjectStatus = exports.$Enums.ProjectStatus = {
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.ProjectPriority = exports.$Enums.ProjectPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

exports.LeaveStatus = exports.$Enums.LeaveStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

exports.OvertimeStatus = exports.$Enums.OvertimeStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

exports.ApproverType = exports.$Enums.ApproverType = {
  DIRECT_MANAGER: 'DIRECT_MANAGER',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  SPECIFIC_USER: 'SPECIFIC_USER',
  POSITION: 'POSITION',
  ROLE: 'ROLE'
};

exports.ApprovalStatus = exports.$Enums.ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

exports.InvitationType = exports.$Enums.InvitationType = {
  EMPLOYEE: 'EMPLOYEE',
  EMPLOYEE_NEW: 'EMPLOYEE_NEW',
  WORKSPACE: 'WORKSPACE'
};

exports.InvitationStatus = exports.$Enums.InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

exports.Prisma.ModelName = {
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  User: 'User',
  Workspace: 'Workspace',
  WorkspaceMember: 'WorkspaceMember',
  Department: 'Department',
  Team: 'Team',
  Position: 'Position',
  PositionLevel: 'PositionLevel',
  Employee: 'Employee',
  EmploymentHistory: 'EmploymentHistory',
  EmployeeDocument: 'EmployeeDocument',
  Project: 'Project',
  ProjectMember: 'ProjectMember',
  ProjectRole: 'ProjectRole',
  LeaveType: 'LeaveType',
  LeaveQuota: 'LeaveQuota',
  Leave: 'Leave',
  OvertimePolicy: 'OvertimePolicy',
  Overtime: 'Overtime',
  ApprovalTemplate: 'ApprovalTemplate',
  ApprovalStep: 'ApprovalStep',
  Approval: 'Approval',
  ApprovalAction: 'ApprovalAction',
  Settings: 'Settings',
  UserConsent: 'UserConsent',
  ActivityLog: 'ActivityLog',
  AuditLog: 'AuditLog',
  Invitation: 'Invitation'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
