const groq = require('../config/groq');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const User = require('../models/User');
const SectorType = require('../models/SectorType');
const SectorUnit = require('../models/SectorUnit');
const MemberCategory = require('../models/MemberCategory');
const Setting = require('../models/Setting');
const ClassificationEngine = require('../utils/classificationEngine');
const { getEthiopianYear, getEthiopianMonth } = require('../utils/ethiopianCalendar');
const { aiActionAuditLog } = require('./aiActionLogger');

const ACTION_PERMISSIONS = {
  ADD_MEMBER: ['admin', 'super_admin', 'sector_officer'],
  EDIT_MEMBER: ['admin', 'super_admin', 'sector_officer'],
  DELETE_MEMBER: ['admin', 'super_admin', 'sector_officer'],
  VIEW_MEMBER: ['admin', 'super_admin', 'sector_officer', 'expert'],
  SEARCH_MEMBER: ['admin', 'super_admin', 'sector_officer', 'expert'],
  TRANSFER_MEMBER: ['admin', 'super_admin'],
  ACTIVATE_MEMBER: ['admin', 'super_admin', 'sector_officer'],
  DEACTIVATE_MEMBER: ['admin', 'super_admin', 'sector_officer'],
  BULK_IMPORT_MEMBERS: ['admin', 'super_admin'],
  BULK_UPDATE_MEMBERS: ['admin', 'super_admin'],
  DETECT_DUPLICATE_MEMBERS: ['admin', 'super_admin', 'expert'],
  GENERATE_MEMBER_REPORT: ['admin', 'super_admin', 'sector_officer', 'expert'],
  RECORD_PAYMENT: ['admin', 'super_admin', 'sector_officer'],
  APPROVE_PAYMENT: ['admin', 'super_admin'],
  REJECT_PAYMENT: ['admin', 'super_admin'],
  UPDATE_PAYMENT: ['admin', 'super_admin', 'sector_officer'],
  DELETE_PAYMENT: ['admin', 'super_admin', 'sector_officer'],
  VERIFY_PAYMENT_SLIP: ['admin', 'super_admin'],
  DETECT_SUSPICIOUS_TRANSACTIONS: ['admin', 'super_admin', 'expert'],
  CALCULATE_ARREARS: ['admin', 'super_admin', 'sector_officer', 'expert'],
  CALCULATE_MONTHLY_DUES: ['admin', 'super_admin', 'sector_officer', 'expert'],
  CREATE_USER: ['admin', 'super_admin'],
  EDIT_USER: ['admin', 'super_admin'],
  DELETE_USER: ['admin', 'super_admin'],
  RESET_PASSWORD: ['admin', 'super_admin'],
  LOCK_ACCOUNT: ['admin', 'super_admin'],
  UNLOCK_ACCOUNT: ['admin', 'super_admin'],
  ASSIGN_ROLE: ['admin', 'super_admin'],
  CREATE_SECTOR: ['admin', 'super_admin'],
  UPDATE_SECTOR: ['admin', 'super_admin'],
  DELETE_SECTOR: ['admin', 'super_admin'],
  MERGE_SECTORS: ['admin', 'super_admin'],
  GENERATE_SECTOR_ANALYTICS: ['admin', 'super_admin', 'sector_officer', 'expert'],
  GENERATE_REPORT: ['admin', 'super_admin', 'sector_officer', 'expert'],
  EXPORT_REPORT: ['admin', 'super_admin', 'sector_officer', 'expert'],
  APPROVE_ALL_PENDING: ['admin', 'super_admin'],
  DELETE_INACTIVE_RECORDS: ['admin', 'super_admin'],
  SEND_REMINDERS: ['admin', 'super_admin', 'sector_officer']
};

const ACTIONS_REQUIRING_CONFIRMATION = [
  'DELETE_MEMBER',
  'BULK_IMPORT_MEMBERS',
  'BULK_UPDATE_MEMBERS',
  'DELETE_PAYMENT',
  'APPROVE_ALL_PENDING',
  'DELETE_INACTIVE_RECORDS',
  'DELETE_USER',
  'RESET_PASSWORD',
  'ASSIGN_ROLE',
  'DELETE_SECTOR',
  'MERGE_SECTORS',
  'BULK_DELETE_MEMBERS',
  'BULK_DELETE_PAYMENTS'
];

const NEVER_EXECUTE_WITHOUT_CONFIRMATION = [
  'DELETE_ALL_MEMBERS',
  'DELETE_ALL_PAYMENTS',
  'DELETE_ALL_USERS'
];

class AIActionExecutor {
  static async parseIntent(query, user) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an AI command parser for the Prosperity Party Dire Dawa Branch Membership Fee Management System.
Parse the user's natural language request into a structured action command.

Available actions with their required parameters:

ADD_MEMBER: { fullName, gender?, phone?, membershipType?, sectorUnitId?, cluster?, financial?:{...} }
EDIT_MEMBER: { memberId|id, updates: { fullName?, gender?, phone?, ... } }
DELETE_MEMBER: { memberId|id }
VIEW_MEMBER: { memberId|id }
SEARCH_MEMBER: { query, filters?:{...} }
TRANSFER_MEMBER: { memberId|id, targetSectorUnitId, targetSectorUnitName? }
ACTIVATE_MEMBER: { memberId|id }
DEACTIVATE_MEMBER: { memberId|id }
DETECT_DUPLICATE_MEMBERS: {}  (auto-detect)
GENERATE_MEMBER_REPORT: { type?: 'active'|'inactive'|'all', format?: 'pdf'|'xlsx'|'csv' }

RECORD_PAYMENT: { memberId|id, amount, method, periodMonth?, periodYear?, frequency? }
APPROVE_PAYMENT: { paymentId }
REJECT_PAYMENT: { paymentId, reason? }
UPDATE_PAYMENT: { paymentId, updates: {...} }
DELETE_PAYMENT: { paymentId }
VERIFY_PAYMENT_SLIP: { slipId }
DETECT_SUSPICIOUS_TRANSACTIONS: {} (auto-detect)
CALCULATE_ARREARS: { memberId? } (all if no memberId)
CALCULATE_MONTHLY_DUES: { memberId? } (all if no memberId)

CREATE_USER: { username, email, password, fullName, role, sectorUnitId? }
EDIT_USER: { userId, updates: {...} }
DELETE_USER: { userId }
RESET_PASSWORD: { userId, newPassword? }
LOCK_ACCOUNT: { userId }
UNLOCK_ACCOUNT: { userId }
ASSIGN_ROLE: { userId, role, sectorUnitId? }

CREATE_SECTOR: { name, sectorTypeId|sectorTypeName }
UPDATE_SECTOR: { sectorId, name? }
DELETE_SECTOR: { sectorId }
MERGE_SECTORS: { sourceSectorId, targetSectorId }
GENERATE_SECTOR_ANALYTICS: { sectorId? } (all if no sectorId)

GENERATE_REPORT: { type: 'daily'|'weekly'|'monthly'|'quarterly'|'annual', format: 'pdf'|'docx'|'xlsx'|'csv' }
EXPORT_REPORT: { type: 'members'|'payments'|'receipts'|'all', format: 'xlsx'|'csv' }

APPROVE_ALL_PENDING: { type: 'payments' }
DELETE_INACTIVE_RECORDS: { type: 'members'|'payments' }
SEND_REMINDERS: { type: 'unpaid'|'all' }

Respond with ONLY a valid JSON object containing:
{
  "action": "ACTION_NAME",
  "parameters": { ... },
  "requiresConfirmation": true|false,
  "summary": "Brief human-readable description of what will be done"
}

If the query is not an action but a question/analytics request, respond with: {"action": null, "reason": "brief explanation"}
Do NOT include any text outside the JSON object.`
          },
          { role: 'user', content: query }
        ],
        max_tokens: 500,
        temperature: 0.1
      });

      const raw = completion.choices[0].message.content.trim();
      const parsed = JSON.parse(raw);

      if (parsed.action === null) {
        return { isAction: false, reason: parsed.reason };
      }

      const action = parsed.action;
      const requiresConfirmation = ACTIONS_REQUIRING_CONFIRMATION.includes(action) ||
        NEVER_EXECUTE_WITHOUT_CONFIRMATION.includes(action);

      return {
        isAction: true,
        action,
        parameters: parsed.parameters || {},
        requiresConfirmation,
        summary: parsed.summary || `${action} operation`
      };
    } catch (err) {
      console.error('[AIActionExecutor] Parse error:', err.message);
      return { isAction: false, reason: 'Could not understand the request as an action.' };
    }
  }

  static checkPermission(action, user) {
    const allowedRoles = ACTION_PERMISSIONS[action];
    if (!allowedRoles) return false;
    const effectiveRoles = allowedRoles.flatMap(r => {
      if (r === 'admin') return ['admin', 'super_admin'];
      return [r];
    });
    return effectiveRoles.includes(user.role);
  }

  static async execute(action, params, user) {
    const startTime = Date.now();
    let result;

    try {
      switch (action) {
        case 'ADD_MEMBER': result = await this._addMember(params, user); break;
        case 'EDIT_MEMBER': result = await this._editMember(params, user); break;
        case 'DELETE_MEMBER': result = await this._deleteMember(params, user); break;
        case 'VIEW_MEMBER': result = await this._viewMember(params, user); break;
        case 'SEARCH_MEMBER': result = await this._searchMember(params, user); break;
        case 'TRANSFER_MEMBER': result = await this._transferMember(params, user); break;
        case 'ACTIVATE_MEMBER': result = await this._activateMember(params, user); break;
        case 'DEACTIVATE_MEMBER': result = await this._deactivateMember(params, user); break;
        case 'DETECT_DUPLICATE_MEMBERS': result = await this._detectDuplicateMembers(user); break;
        case 'GENERATE_MEMBER_REPORT': result = await this._generateMemberReport(params, user); break;
        case 'RECORD_PAYMENT': result = await this._recordPayment(params, user); break;
        case 'APPROVE_PAYMENT': result = await this._approvePayment(params, user); break;
        case 'REJECT_PAYMENT': result = await this._rejectPayment(params, user); break;
        case 'UPDATE_PAYMENT': result = await this._updatePayment(params, user); break;
        case 'DELETE_PAYMENT': result = await this._deletePayment(params, user); break;
        case 'DETECT_SUSPICIOUS_TRANSACTIONS': result = await this._detectSuspiciousTransactions(user); break;
        case 'CALCULATE_ARREARS': result = await this._calculateArrears(params, user); break;
        case 'CALCULATE_MONTHLY_DUES': result = await this._calculateMonthlyDues(params, user); break;
        case 'CREATE_USER': result = await this._createUser(params, user); break;
        case 'EDIT_USER': result = await this._editUser(params, user); break;
        case 'DELETE_USER': result = await this._deleteUser(params, user); break;
        case 'RESET_PASSWORD': result = await this._resetPassword(params, user); break;
        case 'LOCK_ACCOUNT': result = await this._lockAccount(params, user); break;
        case 'UNLOCK_ACCOUNT': result = await this._unlockAccount(params, user); break;
        case 'ASSIGN_ROLE': result = await this._assignRole(params, user); break;
        case 'CREATE_SECTOR': result = await this._createSector(params, user); break;
        case 'UPDATE_SECTOR': result = await this._updateSector(params, user); break;
        case 'DELETE_SECTOR': result = await this._deleteSector(params, user); break;
        case 'MERGE_SECTORS': result = await this._mergeSectors(params, user); break;
        case 'GENERATE_SECTOR_ANALYTICS': result = await this._generateSectorAnalytics(params, user); break;
        case 'GENERATE_REPORT': result = await this._generateReport(params, user); break;
        case 'EXPORT_REPORT': result = await this._exportReport(params, user); break;
        case 'APPROVE_ALL_PENDING': result = await this._approveAllPending(params, user); break;
        case 'DELETE_INACTIVE_RECORDS': result = await this._deleteInactiveRecords(params, user); break;
        case 'SEND_REMINDERS': result = await this._sendReminders(params, user); break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const responseTime = Date.now() - startTime;
      await aiActionAuditLog({
        userId: user.id,
        username: user.username,
        action,
        params,
        result,
        responseTime,
        success: true
      });

      return { success: true, ...result };
    } catch (err) {
      const responseTime = Date.now() - startTime;
      await aiActionAuditLog({
        userId: user.id,
        username: user.username,
        action,
        params,
        result: { error: err.message },
        responseTime,
        success: false
      });
      throw err;
    }
  }

  static async _resolveSectorUnitId(params) {
    if (params.sectorUnitId) return Number(params.sectorUnitId);
    const name = params.sectorUnitName || params.cluster || params.sectorName;
    if (!name) return null;
    const unit = await SectorUnit.findOne({
      where: { name: { [Op.like]: `%${name}%` } }
    });
    return unit ? unit.id : null;
  }

  static async _resolveMember(params) {
    const where = {};
    if (params.memberId) where.memberId = params.memberId;
    else if (params.id) where.id = Number(params.id);
    else if (params.fullName) where.fullName = { [Op.like]: `%${params.fullName}%` };
    else throw new Error('Member identifier (memberId, id, or fullName) is required');
    const member = await Member.findOne({ where });
    if (!member) throw new Error('Member not found');
    return member;
  }

  static async _resolveUser(params) {
    const where = {};
    if (params.userId) where.id = Number(params.userId);
    else if (params.username) where.username = params.username;
    else if (params.email) where.email = params.email;
    else throw new Error('User identifier (userId, username, or email) is required');
    const user = await User.findOne({ where });
    if (!user) throw new Error('User not found');
    return user;
  }

  static _generatePaymentSchedule(year) {
    const schedule = [];
    for (let month = 1; month <= 13; month++) {
      schedule.push({ month, year, expectedDate: null, status: 'Unpaid', actualPaymentDate: null, paymentId: null });
    }
    return schedule;
  }

  static _flattenMemberData(data) {
    const flat = { ...data };
    if (data.address) {
      flat.addressRegion = data.address.region ?? 'Dire Dawa';
      flat.addressCity = data.address.city ?? 'Dire Dawa';
      flat.addressWoreda = data.address.woreda ?? '01';
      delete flat.address;
    }
    if (data.financial) {
      flat.financialSalary = data.financial.salary ?? 0;
      flat.financialEmploymentType = data.financial.employmentType ?? null;
      flat.financialCurrency = data.financial.currency ?? 'ETB';
      flat.financialAllowances = data.financial.allowances ?? 0;
      flat.financialOccupationType = data.financial.occupationType ?? null;
      flat.financialEstimatedIncome = data.financial.estimatedIncome ?? 0;
      flat.financialBusinessType = data.financial.businessType ?? null;
      flat.financialBusinessName = data.financial.businessName ?? null;
      flat.financialEmployees = data.financial.employees ?? 0;
      flat.financialIncome = data.financial.income ?? 0;
      flat.financialCapital = data.financial.capital ?? 0;
      flat.financialInvestmentType = data.financial.investmentType ?? null;
      flat.financialCustomMonthlyFee = data.financial.customMonthlyFee ?? null;
      delete flat.financial;
    }
    if (data.contribution) {
      flat.contributionMonthlyFee = data.contribution.monthlyFee ?? 0;
      flat.contributionPercentage = data.contribution.percentage ?? 0;
      flat.contributionAnnualFee = data.contribution.annualFee ?? 0;
      flat.contributionHqShare = data.contribution.hqShare ?? 0;
      flat.contributionBranchShare = data.contribution.branchShare ?? 0;
      delete flat.contribution;
    }
    if (data.netSalary) {
      flat.netSalaryGrossSalary = data.netSalary.grossSalary ?? 0;
      flat.netSalaryPensionDeduction = data.netSalary.pensionDeduction ?? 0;
      flat.netSalaryTaxDeduction = data.netSalary.taxDeduction ?? 0;
      flat.netSalaryTotalDeductions = data.netSalary.totalDeductions ?? 0;
      flat.netSalaryNetSalary = data.netSalary.netSalary ?? 0;
      flat.netSalaryContributionFee = data.netSalary.contributionFee ?? 0;
      flat.netSalaryFinalNetSalary = data.netSalary.finalNetSalary ?? 0;
      delete flat.netSalary;
    }
    if (data.wing) {
      flat.wingType = (data.wing.wingType && ['Women', 'Youth'].includes(data.wing.wingType)) ? data.wing.wingType : null;
      flat.wingParentMemberId = data.wing.parentMemberId ?? null;
      delete flat.wing;
    }
    delete flat._id;
    delete flat.id;
    return flat;
  }

  // ─── Member Actions ────────────────────────────────────────

  static async _addMember(params, user) {
    const memberData = { ...params };
    delete memberData.action;

    const sectorUnitId = await this._resolveSectorUnitId(params);
    if (sectorUnitId) memberData.sectorUnitId = sectorUnitId;

    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});

    const classification = ClassificationEngine.autoClassifyAndCalculate(memberData, settings);

    const currentYear = getEthiopianYear();
    const paymentSchedule = this._generatePaymentSchedule(currentYear);

    const existing = await Member.findOne({
      where: {
        [Op.or]: [
          { fullName: memberData.fullName },
          ...(memberData.phone ? [{ phone: memberData.phone }] : [])
        ]
      }
    });
    if (existing) {
      throw new Error(`A member with name '${memberData.fullName}' already exists.`);
    }

    const flat = this._flattenMemberData({
      ...memberData,
      subType: classification.subType,
      classificationRuleId: classification.classificationRuleId,
      cluster: classification.cluster || memberData.cluster || 'N/A',
      contribution: {
        monthlyFee: classification.monthlyFee,
        percentage: classification.percentage,
        annualFee: classification.annualFee,
        hqShare: classification.hqShare,
        branchShare: classification.branchShare
      },
      netSalary: classification.netSalary,
      paymentSchedule
    });

    const member = await Member.create(flat);
    return {
      message: `Member '${member.fullName}' created successfully`,
      data: { memberId: member.memberId, id: member.id, fullName: member.fullName }
    };
  }

  static async _editMember(params, user) {
    const member = await this._resolveMember(params);
    const updates = params.updates || params;
    delete updates.memberId;
    delete updates.id;
    delete updates.action;

    if (user.role === 'sector_officer' && user.sectorUnitId) {
      if (member.sectorUnitId !== user.sectorUnitId) {
        throw new Error('Access denied: You can only edit members in your assigned sector unit.');
      }
    }

    const sectorUnitId = await this._resolveSectorUnitId(updates);
    if (sectorUnitId) updates.sectorUnitId = sectorUnitId;

    if (updates.financial || updates.membershipType) {
      let settings = await Setting.findOne();
      if (!settings) settings = await Setting.create({});
      const classification = ClassificationEngine.autoClassifyAndCalculate(updates, settings);
      updates.subType = classification.subType;
      updates.classificationRuleId = classification.classificationRuleId;
      updates.contribution = {
        monthlyFee: classification.monthlyFee,
        percentage: classification.percentage,
        annualFee: classification.annualFee,
        hqShare: classification.hqShare,
        branchShare: classification.branchShare
      };
      updates.netSalary = classification.netSalary;
    }

    const flat = this._flattenMemberData(updates);
    await Member.update(flat, { where: { id: member.id } });
    const updated = await Member.findByPk(member.id);

    return {
      message: `Member '${updated.fullName}' updated successfully`,
      data: { memberId: updated.memberId, id: updated.id, fullName: updated.fullName }
    };
  }

  static async _deleteMember(params, user) {
    const member = await this._resolveMember(params);

    if (user.role === 'sector_officer' && user.sectorUnitId) {
      if (member.sectorUnitId !== user.sectorUnitId) {
        throw new Error('Access denied: You can only delete members in your assigned sector unit.');
      }
    }

    const whereMember = { memberDbId: member.id };
    await Receipt.destroy({ where: whereMember });
    await Payment.destroy({ where: whereMember });
    await member.destroy();

    return {
      message: `Member '${member.fullName}' (${member.memberId}) deleted successfully`,
      data: { memberId: member.memberId, id: member.id }
    };
  }

  static async _viewMember(params, user) {
    const member = await this._resolveMember(params);
    return {
      message: `Member profile for ${member.fullName}`,
      data: member.toJSON()
    };
  }

  static async _searchMember(params, user) {
    const where = {};
    const query = params.query || params.q || '';
    if (query) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${query}%` } },
        { memberId: { [Op.like]: `%${query}%` } },
        { phone: { [Op.like]: `%${query}%` } }
      ];
    }
    if (params.filters) {
      if (params.filters.status) where.status = params.filters.status;
      if (params.filters.membershipType) where.membershipType = params.filters.membershipType;
      if (params.filters.sectorUnitId) where.sectorUnitId = params.filters.sectorUnitId;
    }

    if (user.role === 'sector_officer' && user.sectorUnitId) {
      where.sectorUnitId = user.sectorUnitId;
    }

    const members = await Member.findAll({
      where,
      include: [
        { model: SectorUnit, as: 'sectorUnit' },
        { model: MemberCategory, as: 'memberCategory' }
      ],
      limit: 50,
      order: [['createdAt', 'DESC']]
    });

    return {
      message: `Found ${members.length} member(s)`,
      data: { total: members.length, members: members.map(m => m.toJSON()) }
    };
  }

  static async _transferMember(params, user) {
    const member = await this._resolveMember(params);
    const targetSectorUnitId = params.targetSectorUnitId || await this._resolveSectorUnitId({
      sectorUnitName: params.targetSectorUnitName || params.targetSector
    });
    if (!targetSectorUnitId) throw new Error('Target sector could not be found. Provide sector name or ID.');

    const targetSector = await SectorUnit.findByPk(targetSectorUnitId);
    if (!targetSector) throw new Error('Target sector not found.');

    member.sectorUnitId = targetSectorUnitId;
    await member.save();

    return {
      message: `Member '${member.fullName}' transferred successfully`,
      data: { memberId: member.memberId, newSector: targetSector.name }
    };
  }

  static async _activateMember(params, user) {
    const member = await this._resolveMember(params);
    if (user.role === 'sector_officer' && user.sectorUnitId) {
      if (member.sectorUnitId !== user.sectorUnitId) {
        throw new Error('Access denied');
      }
    }
    member.status = 'Active';
    await member.save();
    return { message: `Member '${member.fullName}' activated successfully`, data: { memberId: member.memberId } };
  }

  static async _deactivateMember(params, user) {
    const member = await this._resolveMember(params);
    if (user.role === 'sector_officer' && user.sectorUnitId) {
      if (member.sectorUnitId !== user.sectorUnitId) {
        throw new Error('Access denied');
      }
    }
    member.status = 'Inactive';
    await member.save();
    return { message: `Member '${member.fullName}' deactivated successfully`, data: { memberId: member.memberId } };
  }

  static async _detectDuplicateMembers(user) {
    const members = await Member.findAll({ attributes: ['id', 'fullName', 'phone', 'memberId'] });
    const duplicates = [];
    const seen = {};

    for (const m of members) {
      const key = m.fullName?.toLowerCase().trim();
      if (key) {
        if (seen[key]) {
          duplicates.push({ member1: seen[key], member2: { id: m.id, fullName: m.fullName, memberId: m.memberId }, matchField: 'fullName' });
        } else {
          seen[key] = { id: m.id, fullName: m.fullName, memberId: m.memberId };
        }
      }
      if (m.phone && m.phone !== 'N/A') {
        if (seen[m.phone]) {
          duplicates.push({ member1: seen[m.phone], member2: { id: m.id, fullName: m.fullName, memberId: m.memberId }, matchField: 'phone' });
        } else {
          seen[m.phone] = { id: m.id, fullName: m.fullName, memberId: m.memberId };
        }
      }
    }

    return {
      message: `Found ${duplicates.length} potential duplicate member(s)`,
      data: { total: duplicates.length, duplicates }
    };
  }

  static async _generateMemberReport(params, user) {
    const type = params.type || 'all';
    const where = {};
    if (type === 'active') where.status = 'Active';
    else if (type === 'inactive') where.status = 'Inactive';

    if (user.role === 'sector_officer' && user.sectorUnitId) {
      where.sectorUnitId = user.sectorUnitId;
    }

    const members = await Member.findAll({
      where,
      include: [
        { model: SectorUnit, as: 'sectorUnit' },
        { model: MemberCategory, as: 'memberCategory' }
      ],
      order: [['fullName', 'ASC']]
    });

    const format = params.format || 'json';
    return {
      message: `${type} member report generated with ${members.length} members`,
      data: { total: members.length, format, members: members.map(m => m.toJSON()) }
    };
  }

  // ─── Payment Actions ────────────────────────────────────────

  static async _recordPayment(params, user) {
    const memberWhere = {};
    if (params.memberId) memberWhere.memberId = params.memberId;
    else if (params.id) memberWhere.id = Number(params.id);
    else if (params.memberDbId) memberWhere.id = Number(params.memberDbId);
    else throw new Error('Member identifier is required');

    const member = await Member.findOne({ where: memberWhere });
    if (!member) throw new Error('Member not found');

    const periodMonth = params.periodMonth || getEthiopianMonth();
    const periodYear = params.periodYear || getEthiopianYear();

    const existingPayment = await Payment.findOne({
      where: { memberDbId: member.id, periodMonth, periodYear, status: 'Paid' }
    });
    if (existingPayment) {
      throw new Error(`Member ${member.fullName} has already paid for ${periodMonth}/${periodYear}.`);
    }

    const receiptId = `RCP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await Payment.create({
      receiptId,
      memberDbId: member.id,
      memberId: member.memberId,
      amount: params.amount,
      currency: params.currency || 'ETB',
      frequency: params.frequency || 'Monthly',
      method: params.method || 'Cash',
      paymentDate: params.paymentDate || new Date(),
      periodMonth,
      periodYear,
      receivedBy: params.receivedBy || user.fullName || user.username,
      status: params.status || 'Paid',
      notes: params.notes || null
    });

    await Receipt.create({
      receiptId,
      paymentDbId: payment.id,
      memberDbId: member.id,
      memberId: member.memberId,
      memberName: member.fullName,
      amount: payment.amount,
      currency: payment.currency,
      periodMonth: payment.periodMonth,
      periodYear: payment.periodYear,
      paymentMethod: payment.method,
      issuedBy: payment.receivedBy,
      branch: member.branch
    });

    return {
      message: `Payment of ${params.amount} ETB recorded for ${member.fullName} (${periodMonth}/${periodYear})`,
      data: { paymentId: payment.id, receiptId }
    };
  }

  static async _approvePayment(params, user) {
    const payment = await Payment.findByPk(params.paymentId);
    if (!payment) throw new Error('Payment not found');
    payment.status = 'Paid';
    await payment.save();
    return { message: `Payment #${params.paymentId} approved successfully`, data: { paymentId: payment.id } };
  }

  static async _rejectPayment(params, user) {
    const payment = await Payment.findByPk(params.paymentId);
    if (!payment) throw new Error('Payment not found');
    await payment.destroy();
    return { message: `Payment #${params.paymentId} rejected and removed`, data: { paymentId: Number(params.paymentId) } };
  }

  static async _updatePayment(params, user) {
    const payment = await Payment.findByPk(params.paymentId);
    if (!payment) throw new Error('Payment not found');

    const member = await Member.findByPk(payment.memberDbId);
    if (user.role === 'sector_officer' && user.sectorUnitId) {
      if (member && member.sectorUnitId !== user.sectorUnitId) {
        throw new Error('Access denied: You can only edit payments for your assigned sector unit.');
      }
    }

    const updates = params.updates || params;
    delete updates.paymentId;
    delete updates.action;

    await payment.update(updates);
    return { message: `Payment #${params.paymentId} updated successfully`, data: { paymentId: payment.id } };
  }

  static async _deletePayment(params, user) {
    const payment = await Payment.findByPk(params.paymentId);
    if (!payment) throw new Error('Payment not found');

    const member = await Member.findByPk(payment.memberDbId);
    if (user.role === 'sector_officer' && user.sectorUnitId) {
      if (member && member.sectorUnitId !== user.sectorUnitId) {
        throw new Error('Access denied');
      }
    }

    await Receipt.destroy({ where: { paymentDbId: payment.id } });
    await payment.destroy();

    return { message: `Payment #${params.paymentId} deleted successfully`, data: { paymentId: Number(params.paymentId) } };
  }

  static async _detectSuspiciousTransactions(user) {
    const Q = sequelize.QueryTypes.SELECT;
    const suspicious = [];

    const duplicatesByAmount = await sequelize.query(`
      SELECT p1.id, p1.memberId, p1.amount, p1.periodMonth, p1.periodYear, p1.paymentDate, m.fullName
      FROM payments p1
      JOIN payments p2 ON p1.memberDbId = p2.memberDbId AND p1.amount = p2.amount
        AND p1.periodMonth = p2.periodMonth AND p1.periodYear = p2.periodYear
        AND p1.id != p2.id
      JOIN members m ON p1.memberDbId = m.id
      WHERE p1.status = 'Paid'
      GROUP BY p1.id
    `, { type: Q });

    if (duplicatesByAmount.length > 0) {
      suspicious.push({ type: 'DUPLICATE_PAYMENT', count: duplicatesByAmount.length, details: duplicatesByAmount.slice(0, 10) });
    }

    const highAmount = await sequelize.query(`
      SELECT p.*, m.fullName FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.amount > (SELECT COALESCE(MAX(contributionMonthlyFee), 0) * 5 FROM members)
      AND p.status = 'Paid'
      ORDER BY p.amount DESC LIMIT 10
    `, { type: Q });

    if (highAmount.length > 0) {
      suspicious.push({ type: 'HIGH_AMOUNT', count: highAmount.length, details: highAmount });
    }

    return {
      message: `Found ${suspicious.length} suspicious activity type(s)`,
      data: suspicious
    };
  }

  static async _calculateArrears(params, user) {
    const Q = sequelize.QueryTypes.SELECT;
    const month = getEthiopianMonth();
    const year = getEthiopianYear();
    const arrearsThreshold = params.months || 3;

    const scopeClause = (user.role === 'sector_officer' && user.sectorUnitId)
      ? ` AND m.sectorUnitId = ${sequelize.escape(user.sectorUnitId)}` : '';

    const arrears = await sequelize.query(`
      SELECT m.id, m.memberId, m.fullName, m.contributionMonthlyFee, su.name AS sectorName,
        (SELECT COUNT(*) FROM payments p2
         WHERE p2.memberDbId = m.id AND p2.status = 'Paid'
         AND (p2.periodYear < ${year} OR (p2.periodYear = ${year} AND p2.periodMonth < ${month}))
        ) AS totalPaidMonths,
        (${month} - 1 + (${year} - EXTRACT(YEAR FROM m.registrationDate)) * 12) AS expectedMonths
      FROM members m
      LEFT JOIN sector_units su ON m.sectorUnitId = su.id
      WHERE m.status = 'Active' ${scopeClause}
      HAVING (expectedMonths - totalPaidMonths) >= ${arrearsThreshold}
      ORDER BY (expectedMonths - totalPaidMonths) DESC
      LIMIT 50
    `, { type: Q });

    return {
      message: `Found ${arrears.length} member(s) with ${arrearsThreshold}+ months in arrears`,
      data: { total: arrears.length, arrears }
    };
  }

  static async _calculateMonthlyDues(params, user) {
    const Q = sequelize.QueryTypes.SELECT;
    const month = params.month || getEthiopianMonth();
    const year = params.year || getEthiopianYear();

    const scopeClause = (user.role === 'sector_officer' && user.sectorUnitId)
      ? ` WHERE m.sectorUnitId = ${sequelize.escape(user.sectorUnitId)}` : '';

    const [result] = await sequelize.query(`
      SELECT COUNT(*) AS totalMembers,
             COALESCE(SUM(m.contributionMonthlyFee), 0) AS totalMonthlyDues
      FROM members m ${scopeClause}
    `, { type: Q });

    return {
      message: `Monthly dues for ${year}/${month}: ETB ${Number(result.totalMonthlyDues).toLocaleString()} from ${result.totalMembers} members`,
      data: {
        month,
        year,
        totalMembers: Number(result.totalMembers),
        totalMonthlyDues: Number(result.totalMonthlyDues)
      }
    };
  }

  // ─── User Actions ───────────────────────────────────────────

  static async _createUser(params, user) {
    const { username, email, password, fullName, role } = params;
    if (!username || !email || !password || !fullName) {
      throw new Error('username, email, password, and fullName are required');
    }

    const existing = await User.findOne({
      where: { [Op.or]: [{ email: email.toLowerCase() }, { username }] }
    });
    if (existing) {
      throw new Error('User with this email or username already exists.');
    }

    const newUser = await User.create({
      username,
      email,
      password,
      fullName,
      role: role || 'sector_officer',
      sectorUnitId: params.sectorUnitId || null,
      isActive: true
    });

    return {
      message: `User '${fullName}' created successfully with role '${role || 'sector_officer'}'`,
      data: { userId: newUser.id, username: newUser.username, role: newUser.role }
    };
  }

  static async _editUser(params, user) {
    const target = await this._resolveUser(params);
    const updates = params.updates || params;
    delete updates.userId;
    delete updates.username;
    delete updates.action;

    if (updates.fullName) target.fullName = updates.fullName;
    if (updates.email) target.email = updates.email;
    if (updates.role) target.role = updates.role;
    if (updates.sectorUnitId !== undefined) target.sectorUnitId = updates.sectorUnitId || null;
    if (updates.isActive !== undefined) target.isActive = updates.isActive;

    await target.save();
    return { message: `User '${target.fullName}' updated successfully`, data: { userId: target.id, username: target.username } };
  }

  static async _deleteUser(params, user) {
    const target = await this._resolveUser(params);
    if (target.id === user.id) {
      throw new Error('You cannot delete your own account.');
    }
    await target.destroy();
    return { message: `User '${target.fullName}' deleted successfully`, data: { userId: target.id } };
  }

  static async _resetPassword(params, user) {
    const target = await this._resolveUser(params);
    const newPassword = params.newPassword || 'reset123';
    target.password = newPassword;
    await target.save();
    return { message: `Password reset for '${target.fullName}'. New password: ${newPassword}`, data: { userId: target.id } };
  }

  static async _lockAccount(params, user) {
    const target = await this._resolveUser(params);
    target.isActive = false;
    await target.save();
    return { message: `Account '${target.fullName}' locked successfully`, data: { userId: target.id } };
  }

  static async _unlockAccount(params, user) {
    const target = await this._resolveUser(params);
    target.isActive = true;
    await target.save();
    return { message: `Account '${target.fullName}' unlocked successfully`, data: { userId: target.id } };
  }

  static async _assignRole(params, user) {
    const target = await this._resolveUser(params);
    if (!params.role) throw new Error('Role is required');
    target.role = params.role;
    if (params.sectorUnitId !== undefined) target.sectorUnitId = params.sectorUnitId || null;
    await target.save();
    return { message: `Role '${params.role}' assigned to '${target.fullName}'`, data: { userId: target.id, role: target.role } };
  }

  // ─── Sector Actions ─────────────────────────────────────────

  static async _createSector(params, user) {
    const name = params.name || params.sectorName;
    if (!name) throw new Error('Sector name is required');

    let sectorTypeId = params.sectorTypeId;
    if (!sectorTypeId && params.sectorTypeName) {
      const st = await SectorType.findOne({ where: { name: params.sectorTypeName } });
      if (st) sectorTypeId = st.id;
    }
    if (!sectorTypeId) sectorTypeId = 1;

    const existing = await SectorUnit.findOne({ where: { name } });
    if (existing) throw new Error(`Sector '${name}' already exists`);

    const sector = await SectorUnit.create({ name, sectorTypeId });
    return { message: `Sector '${name}' created successfully`, data: { sectorId: sector.id, name: sector.name } };
  }

  static async _updateSector(params, user) {
    const sector = params.sectorId
      ? await SectorUnit.findByPk(params.sectorId)
      : await SectorUnit.findOne({ where: { name: { [Op.like]: `%${params.sectorName || ''}%` } } });
    if (!sector) throw new Error('Sector not found');

    if (params.name) sector.name = params.name;
    if (params.sectorTypeId) sector.sectorTypeId = params.sectorTypeId;
    await sector.save();

    return { message: `Sector '${sector.name}' updated successfully`, data: { sectorId: sector.id } };
  }

  static async _deleteSector(params, user) {
    const sector = params.sectorId
      ? await SectorUnit.findByPk(params.sectorId)
      : await SectorUnit.findOne({ where: { name: { [Op.like]: `%${params.sectorName || ''}%` } } });
    if (!sector) throw new Error('Sector not found');

    const memberCount = await Member.count({ where: { sectorUnitId: sector.id } });
    if (memberCount > 0) {
      throw new Error(`Cannot delete sector '${sector.name}': ${memberCount} member(s) are assigned to it. Transfer them first.`);
    }

    await sector.destroy();
    return { message: `Sector '${sector.name}' deleted successfully`, data: { sectorId: sector.id } };
  }

  static async _mergeSectors(params, user) {
    const source = params.sourceSectorId
      ? await SectorUnit.findByPk(params.sourceSectorId)
      : await SectorUnit.findOne({ where: { name: { [Op.like]: `%${params.sourceSectorName || ''}%` } } });
    if (!source) throw new Error('Source sector not found');

    const target = params.targetSectorId
      ? await SectorUnit.findByPk(params.targetSectorId)
      : await SectorUnit.findOne({ where: { name: { [Op.like]: `%${params.targetSectorName || ''}%` } } });
    if (!target) throw new Error('Target sector not found');

    await Member.update({ sectorUnitId: target.id }, { where: { sectorUnitId: source.id } });
    await source.destroy();

    return {
      message: `Sectors merged: '${source.name}' → '${target.name}'. Members reassigned.`,
      data: { sourceSector: source.name, targetSector: target.name }
    };
  }

  static async _generateSectorAnalytics(params, user) {
    const Q = sequelize.QueryTypes.SELECT;
    const month = getEthiopianMonth();
    const year = getEthiopianYear();

    let scopeClause = '';
    if (params.sectorId) {
      scopeClause = ` AND m.sectorUnitId = ${sequelize.escape(params.sectorId)}`;
    } else if (user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${sequelize.escape(user.sectorUnitId)}`;
    }

    const sectors = await sequelize.query(`
      SELECT su.id, su.name,
        COUNT(DISTINCT m.id) AS totalMembers,
        COUNT(DISTINCT paid.memberDbId) AS paidMembers,
        COALESCE(SUM(paid.amount), 0) AS totalRevenue
      FROM sector_units su
      JOIN members m ON m.sectorUnitId = su.id
      LEFT JOIN (
        SELECT memberDbId, amount FROM payments
        WHERE status = 'Paid' AND periodMonth = ${month} AND periodYear = ${year}
      ) paid ON m.id = paid.memberDbId
      WHERE m.status = 'Active' ${scopeClause}
      GROUP BY su.id, su.name
      ORDER BY totalRevenue DESC
    `, { type: Q });

    const enriched = sectors.map(s => ({
      sectorId: s.id,
      sectorName: s.name,
      totalMembers: Number(s.totalMembers),
      paidMembers: Number(s.paidMembers),
      unpaidMembers: Number(s.totalMembers) - Number(s.paidMembers),
      totalRevenue: Number(s.totalRevenue),
      collectionRate: Number(s.totalMembers) > 0
        ? Math.round((Number(s.paidMembers) / Number(s.totalMembers)) * 100) : 0
    }));

    return {
      message: `Sector analytics generated for ${enriched.length} sector(s)`,
      data: enriched
    };
  }

  // ─── Report Actions ─────────────────────────────────────────

  static async _generateReport(params, user) {
    const type = params.type || 'monthly';
    const format = params.format || 'json';

    const Q = sequelize.QueryTypes.SELECT;
    const year = getEthiopianYear();
    const month = getEthiopianMonth();

    let scopeClause = '';
    if (user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${sequelize.escape(user.sectorUnitId)}`;
    }

    let reportData;
    switch (type) {
      case 'daily':
      case 'weekly':
      case 'monthly': {
        const [summary] = await sequelize.query(`
          SELECT COUNT(DISTINCT p.memberDbId) AS payers,
                 COALESCE(SUM(p.amount), 0) AS revenue,
                 COUNT(*) AS transactions
          FROM payments p
          JOIN members m ON p.memberDbId = m.id
          WHERE p.status = 'Paid' AND p.periodMonth = ${month} AND p.periodYear = ${year} ${scopeClause}
        `, { type: Q });
        reportData = { period: `${year}/${month}`, ...summary };
        break;
      }
      case 'quarterly': {
        const quarterly = await sequelize.query(`
          SELECT CASE
            WHEN p.periodMonth BETWEEN 1 AND 3 THEN 'Q1'
            WHEN p.periodMonth BETWEEN 4 AND 6 THEN 'Q2'
            WHEN p.periodMonth BETWEEN 7 AND 9 THEN 'Q3'
            WHEN p.periodMonth BETWEEN 10 AND 13 THEN 'Q4'
          END AS quarter,
          COALESCE(SUM(p.amount), 0) AS revenue,
          COUNT(DISTINCT p.memberDbId) AS payers
          FROM payments p
          JOIN members m ON p.memberDbId = m.id
          WHERE p.status = 'Paid' AND p.periodYear = ${year} ${scopeClause}
          GROUP BY quarter ORDER BY quarter
        `, { type: Q });
        reportData = { year, quarters: quarterly };
        break;
      }
      case 'annual': {
        const [annual] = await sequelize.query(`
          SELECT COALESCE(SUM(p.amount), 0) AS totalRevenue,
                 COUNT(DISTINCT p.memberDbId) AS totalPayers,
                 COUNT(*) AS totalTransactions
          FROM payments p
          JOIN members m ON p.memberDbId = m.id
          WHERE p.status = 'Paid' AND p.periodYear = ${year} ${scopeClause}
        `, { type: Q });
        reportData = { year, ...annual };
        break;
      }
      default:
        throw new Error(`Unknown report type: ${type}`);
    }

    return {
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} report generated`,
      data: { type, format, report: reportData }
    };
  }

  static async _exportReport(params, user) {
    const type = params.type || 'members';
    const format = params.format || 'xlsx';
    const Q = sequelize.QueryTypes.SELECT;

    const scopeClause = (user.role === 'sector_officer' && user.sectorUnitId)
      ? ` WHERE m.sectorUnitId = ${sequelize.escape(user.sectorUnitId)}` : '';

    let exportData;
    if (type === 'members') {
      const members = await sequelize.query(`
        SELECT m.memberId, m.fullName, m.gender, m.phone, m.membershipType,
               m.contributionMonthlyFee, m.status, m.registrationDate,
               COALESCE(su.name, '') AS sectorName
        FROM members m
        LEFT JOIN sector_units su ON m.sectorUnitId = su.id
        ${scopeClause}
        ORDER BY m.fullName
      `, { type: Q });
      exportData = { rows: members, total: members.length };
    } else if (type === 'payments') {
      const payments = await sequelize.query(`
        SELECT p.receiptId, p.memberId, m.fullName, p.amount, p.method,
               p.periodMonth, p.periodYear, p.paymentDate, p.status
        FROM payments p
        JOIN members m ON p.memberDbId = m.id
        ${scopeClause.replace('m.', 'm.')}
        ORDER BY p.paymentDate DESC
      `, { type: Q });
      exportData = { rows: payments, total: payments.length };
    } else {
      exportData = { rows: [], total: 0 };
    }

    return {
      message: `${type} data exported with ${exportData.total} records`,
      data: { type, format, total: exportData.total, rows: exportData.rows.slice(0, 100) }
    };
  }

  // ─── Bulk Operations ─────────────────────────────────────────

  static async _approveAllPending(params, user) {
    const pending = await Payment.findAll({
      where: { status: { [Op.ne]: 'Paid' } }
    });

    if (pending.length === 0) {
      return { message: 'No pending payments found', data: { approved: 0 } };
    }

    const ids = pending.map(p => p.id);
    await Payment.update({ status: 'Paid' }, { where: { id: { [Op.in]: ids } } });

    return {
      message: `${pending.length} pending payment(s) approved successfully`,
      data: { approved: pending.length }
    };
  }

  static async _deleteInactiveRecords(params, user) {
    const type = params.type || 'members';
    let deletedCount = 0;

    if (type === 'members') {
      deletedCount = await Member.destroy({ where: { status: 'Inactive' } });
    } else if (type === 'payments') {
      deletedCount = await Payment.destroy({ where: {} });
    }

    return {
      message: `${deletedCount} inactive ${type} record(s) deleted`,
      data: { type, deletedCount }
    };
  }

  static async _sendReminders(params, user) {
    const Q = sequelize.QueryTypes.SELECT;
    const month = getEthiopianMonth();
    const year = getEthiopianYear();

    const scopeClause = (user.role === 'sector_officer' && user.sectorUnitId)
      ? ` AND m.sectorUnitId = ${sequelize.escape(user.sectorUnitId)}` : '';

    const unpaid = await sequelize.query(`
      SELECT m.id, m.memberId, m.fullName, m.phone, m.contributionMonthlyFee, su.name AS sectorName
      FROM members m
      LEFT JOIN payments p ON m.id = p.memberDbId AND p.periodMonth = ${month}
        AND p.periodYear = ${year} AND p.status = 'Paid'
      LEFT JOIN sector_units su ON m.sectorUnitId = su.id
      WHERE p.id IS NULL AND m.status = 'Active' AND m.phone IS NOT NULL
        AND m.phone != 'N/A' AND m.phone != '' ${scopeClause}
      LIMIT 100
    `, { type: Q });

    return {
      message: `${unpaid.length} reminder(s) would be sent to unpaid members`,
      data: { total: unpaid.length, members: unpaid }
    };
  }
}

module.exports = AIActionExecutor;
