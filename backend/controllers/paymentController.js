// controllers/paymentController.js - Payment Controller (MySQL / Sequelize)
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const Payment  = require('../models/Payment');
const Receipt  = require('../models/Receipt');
const Member   = require('../models/Member');
const Contribution = require('../models/Contribution');
const { getEthiopianYear, getEthiopianMonth } = require('../utils/ethiopianCalendar');
const { createAuditLog } = require('../utils/auditLogger');

// ─── Record a new payment ─────────────────────────────────────────────────────
exports.createPayment = async (req, res) => {
  try {
    const paymentData = req.body;

    // Verify member exists (accept both integer id and memberId string)
    const memberWhere = isNaN(paymentData.member)
      ? { memberId: paymentData.member }
      : { id: Number(paymentData.member) };
    const member = await Member.findOne({ where: memberWhere });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Check for duplicate payment for same period
    const periodMonth = paymentData.period?.month || paymentData.periodMonth;
    const periodYear  = paymentData.period?.year  || paymentData.periodYear;
    
    const existingPayment = await Payment.findOne({
      where: {
        memberDbId: member.id,
        periodMonth,
        periodYear,
        status: 'Paid'
      }
    });

    if (existingPayment) {
      return res.status(400).json({ 
        success: false, 
        message: `Member ${member.fullName} has already paid for ${periodMonth}/${periodYear}.` 
      });
    }

    const receiptId = `RCP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await Payment.create({
      receiptId,
      memberDbId:       member.id,
      memberId:         member.memberId,
      contributionDbId: paymentData.contribution || null,
      amount:           paymentData.amount,
      currency:         paymentData.currency || 'ETB',
      frequency:        paymentData.frequency || 'Monthly',
      method:           paymentData.method,
      paymentDate:      paymentData.paymentDate || new Date(),
      periodMonth:      paymentData.period?.month || paymentData.periodMonth,
      periodYear:       paymentData.period?.year  || paymentData.periodYear,
      receivedBy:       paymentData.receivedBy,
      status:           paymentData.status || 'Paid',
      notes:            paymentData.notes || null
    });

    // Generate receipt
    const receipt = await Receipt.create({
      receiptId,
      paymentDbId:   payment.id,
      memberDbId:    member.id,
      memberId:      member.memberId,
      memberName:    member.fullName,
      amount:        payment.amount,
      currency:      payment.currency,
      periodMonth:   payment.periodMonth,
      periodYear:    payment.periodYear,
      paymentMethod: payment.method,
      issuedBy:      payment.receivedBy,
      branch:        member.branch
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded and receipt generated',
      data: { payment, receipt }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get all payments ─────────────────────────────────────────────────────────
exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 50, memberId, status, branch, cluster, sector, membershipType, sectorId, categoryId } = req.query;
    const { Op } = require('sequelize');
    const where = {};
    if (memberId) where.memberId = memberId;
    if (status)   where.status   = status;
    if (req.query.month) where.periodMonth = Number(req.query.month);
    if (req.query.year)  where.periodYear  = Number(req.query.year);
    
    // Build member-level where for join filtering
    const memberWhere = {};
    if (branch)        memberWhere.branch        = branch;
    if (cluster)       memberWhere.cluster       = cluster;
    if (sector)        memberWhere.sector        = sector;
    if (membershipType)memberWhere.membershipType = membershipType;
    // Hierarchy filters
    if (sectorId) {
      memberWhere.sectorUnitId = sectorId;
    } else if (req.query.sectorType) {
      const sectorTypeRec = await require('../models/SectorType').findOne({ where: { name: req.query.sectorType } });
      if (sectorTypeRec) {
        const units = await require('../models/SectorUnit').findAll({ where: { sectorTypeId: sectorTypeRec.id }, attributes: ['id'] });
        memberWhere.sectorUnitId = { [Op.in]: units.map(u => u.id) };
      }
    }
    if (categoryId) memberWhere.memberCategoryId = categoryId;

    const offset = (Number(page) - 1) * Number(limit);
    const { count: total, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [{
        model: Member,
        as:    'memberInfo',
        where: Object.keys(memberWhere).length > 0 ? memberWhere : undefined,
        include: [
          {
            model: require('../models/SectorUnit'),
            as: 'sectorUnit',
            attributes: ['name']
          },
          {
            model: require('../models/MemberCategory'),
            as: 'memberCategory',
            attributes: ['name']
          }
        ]
      }],
      offset,
      limit: Number(limit),
      order: [['paymentDate', 'DESC']]
    });

    const monthNum = req.query.month ? Number(req.query.month) : getEthiopianMonth();
    const yearNum  = req.query.year  ? Number(req.query.year)  : getEthiopianYear();

    // If member-level filters are active, resolve matching member IDs first
    let memberDbIds = null;
    if (Object.keys(memberWhere).length > 0) {
      const matchingMembers = await Member.findAll({ where: memberWhere, attributes: ['id'] });
      memberDbIds = matchingMembers.map(m => m.id);
    }

    const summary = {
      totalMembers: 0,
      totalMonthlyRevenue: 0,
      totalYearlyRevenue: 0
    };

    const payWhere = { status: 'Paid' };
    if (memberDbIds) payWhere.memberDbId = { [Op.in]: memberDbIds };

    // Run all summary queries in parallel
    await Promise.all([
      (async () => {
        summary.totalMembers = await Payment.count({
          distinct: true,
          col: 'memberDbId',
          where: { ...payWhere, periodMonth: monthNum, periodYear: yearNum }
        });
      })(),
      (async () => {
        summary.totalMonthlyRevenue = await Payment.sum('amount', {
          where: { ...payWhere, periodMonth: monthNum, periodYear: yearNum }
        }) || 0;
      })(),
      (async () => {
        summary.totalYearlyRevenue = await Payment.sum('amount', {
          where: { ...payWhere, periodYear: yearNum }
        }) || 0;
      })()
    ]);

    res.json({
      success: true,
      data: payments,
      summary,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get single payment ───────────────────────────────────────────────────────
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{ model: Member, as: 'memberInfo', attributes: ['fullName', 'memberId', 'branch'] }]
    });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get payments by member ───────────────────────────────────────────────────
exports.getPaymentsByMember = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { memberId: req.params.memberId },
      order: [['paymentDate', 'DESC']]
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Bulk payments ────────────────────────────────────────────────────────────
exports.bulkPayments = async (req, res) => {
  try {
    const payments = req.body;
    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of payments.' });
    }

    const createdPayments = [];
    const errors = [];

    for (let i = 0; i < payments.length; i++) {
      try {
        const paymentData = payments[i];
        const memberWhere = isNaN(paymentData.member)
          ? { memberId: paymentData.member }
          : { id: Number(paymentData.member) };
        const member = await Member.findOne({ where: memberWhere });

        if (!member) {
          errors.push({ index: i, error: 'Member not found' });
          continue;
        }

        // Check for duplicate
        const periodMonth = paymentData.period?.month || paymentData.periodMonth;
        const periodYear  = paymentData.period?.year  || paymentData.periodYear;
        const existing = await Payment.findOne({
          where: { memberDbId: member.id, periodMonth, periodYear, status: 'Paid' }
        });
        if (existing) {
          errors.push({ index: i, error: `Member ${member.fullName} already paid for ${periodMonth}/${periodYear}` });
          continue;
        }

        const receiptId = `RCP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const payment = await Payment.create({
          receiptId,
          memberDbId:  member.id,
          memberId:    member.memberId,
          amount:      paymentData.amount,
          currency:    paymentData.currency || 'ETB',
          frequency:   paymentData.frequency || 'Monthly',
          method:      paymentData.method,
          paymentDate: paymentData.paymentDate || new Date(),
          periodMonth: paymentData.period?.month || paymentData.periodMonth,
          periodYear:  paymentData.period?.year  || paymentData.periodYear,
          receivedBy:  paymentData.receivedBy,
          status:      paymentData.status || 'Paid',
          notes:       paymentData.notes || null
        });

        await Receipt.create({
          receiptId,
          paymentDbId:   payment.id,
          memberDbId:    member.id,
          memberId:      member.memberId,
          memberName:    member.fullName,
          amount:        payment.amount,
          currency:      payment.currency,
          periodMonth:   payment.periodMonth,
          periodYear:    payment.periodYear,
          paymentMethod: payment.method,
          issuedBy:      payment.receivedBy,
          branch:        member.branch
        });

        createdPayments.push(payment);
      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Processed ${createdPayments.length} payments`,
      data: createdPayments,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get monthly payment status for all members ────────────────────────────────
exports.getMonthlyStatus = async (req, res) => {
  try {
    const { month, year, search, branch, cluster, sector, membershipType, paymentStatus, page = 1, limit = 50 } = req.query;
    
    const targetMonth = month ? Number(month) : getEthiopianMonth();
    const targetYear  = year  ? Number(year)  : getEthiopianYear();

    const { Op } = require('sequelize');
    const { sequelize } = require('../config/db');
    const memberWhere = {};
    if (search) {
      memberWhere[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { memberId: { [Op.like]: `%${search}%` } }
      ];
    }
    if (branch)        memberWhere.branch        = branch;
    if (cluster)       memberWhere.cluster       = cluster;
    if (sector)        memberWhere.sector        = sector;
    if (membershipType)memberWhere.membershipType = membershipType;
    // Hierarchy filters
    if (req.query.sectorId) {
      memberWhere.sectorUnitId = req.query.sectorId;
    } else if (req.query.sectorType) {
      const sectorTypeRec = await require('../models/SectorType').findOne({ where: { name: req.query.sectorType } });
      if (sectorTypeRec) {
        const units = await require('../models/SectorUnit').findAll({ where: { sectorTypeId: sectorTypeRec.id }, attributes: ['id'] });
        memberWhere.sectorUnitId = { [Op.in]: units.map(u => u.id) };
      }
    }
    if (req.query.categoryId) memberWhere.memberCategoryId = req.query.categoryId;

    // Dynamic Filter for paymentStatus using targetYear/targetMonth
    if (paymentStatus === 'Paid') {
      memberWhere.id = { [Op.in]: sequelize.literal(`(SELECT memberDbId FROM payments WHERE periodMonth = ${targetMonth} AND periodYear = ${targetYear} AND status = 'Paid')`) };
    } else if (paymentStatus === 'Unpaid') {
      memberWhere.id = { [Op.notIn]: sequelize.literal(`(SELECT memberDbId FROM payments WHERE periodMonth = ${targetMonth} AND periodYear = ${targetYear} AND status = 'Paid')`) };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count: total, rows: members } = await Member.findAndCountAll({
      where: memberWhere,
      include: [
        {
          model: Payment,
          as: 'payments',
          where: { periodMonth: targetMonth, periodYear: targetYear, status: 'Paid' },
          required: false // Left outer join
        },
        {
          model: require('../models/SectorUnit'),
          as: 'sectorUnit',
          attributes: ['name']
        },
        {
          model: require('../models/MemberCategory'),
          as: 'memberCategory',
          attributes: ['name']
        }
      ],
      offset,
      limit: Number(limit),
      order: [['fullName', 'ASC']]
    });

    // Map members to include a simplified payment status for the UI
    const mappedMembers = members.map(m => {
      const obj = m.toJSON();
      const currentPayment = (obj.payments && obj.payments.length > 0) ? obj.payments[0] : null;

      return {
        _id: obj.id,
        memberId: obj.memberId,
        fullName: obj.fullName,
        branch: obj.sectorUnit?.name || obj.sector || obj.branch,
        fee: obj.contribution?.monthlyFee || obj.contributionMonthlyFee || 0,
        paymentStatus: currentPayment ? 'Paid' : 'Unpaid',
        paymentDate: currentPayment ? currentPayment.paymentDate : null,
        paymentId: currentPayment ? currentPayment.id : null
      };
    });

    // Calculate summary based on recorded payments
    const payWhere = { status: 'Paid' };
    if (req.query.sectorId) {
      const matchingMembers = await Member.findAll({ where: { sectorUnitId: req.query.sectorId }, attributes: ['id'] });
      const ids = matchingMembers.map(m => m.id);
      if (ids.length > 0) payWhere.memberDbId = { [Op.in]: ids };
    }

    const totalPaidMembers = await Payment.count({
      distinct: true,
      col: 'memberDbId',
      where: { ...payWhere, periodMonth: targetMonth, periodYear: targetYear }
    });

    const totalMonthlyRevenue = await Payment.sum('amount', { 
      where: { ...payWhere, periodMonth: targetMonth, periodYear: targetYear }
    }) || 0;

    const totalYearlyRevenue = await Payment.sum('amount', { 
      where: { ...payWhere, periodYear: targetYear }
    }) || 0;

    res.json({
      success: true,
      data: mappedMembers,
      summary: {
        totalMembers: total, // actual total members matching the filter
        totalPaidMembers,
        totalMonthlyRevenue: totalMonthlyRevenue,
        totalYearlyRevenue: totalYearlyRevenue
      },
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
      period: { month: targetMonth, year: targetYear }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Payment ──────────────────────────────────────────────────────────
exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

    const member = await Member.findByPk(payment.memberDbId);
    if (req.user?.role === 'sector_officer' && req.user.sectorUnitId) {
      if (member && member.sectorUnitId !== req.user.sectorUnitId) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only edit payments for your assigned sector unit.' });
      }
    }

    await payment.update(req.body);
    res.json({ success: true, message: 'Payment updated successfully', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Payment ──────────────────────────────────────────────────────────
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

    const member = await Member.findByPk(payment.memberDbId);
    if (req.user?.role === 'sector_officer' && req.user.sectorUnitId) {
      if (member && member.sectorUnitId !== req.user.sectorUnitId) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only delete payments for your assigned sector unit.' });
      }
    }

    // Also delete the receipt if it exists
    await Receipt.destroy({ where: { paymentDbId: payment.id } });
    await payment.destroy();
    
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Bulk delete payments ────────────────────────────────────────────────────
exports.bulkDeletePayments = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Please provide an array of payment IDs.' });
    }

    // Delete related receipts first
    await Receipt.destroy({ where: { paymentDbId: { [Op.in]: ids } }, transaction: t });

    const deletedCount = await Payment.destroy({ where: { id: { [Op.in]: ids } }, transaction: t });

    await t.commit();

    await createAuditLog({
      userId: req.user.id,
      username: req.user.username,
      actionType: 'BULK_DELETE_PAYMENTS',
      recordCount: deletedCount,
      req
    });

    res.json({
      success: true,
      message: `${deletedCount} payments deleted successfully`,
      data: { deletedCount }
    });
  } catch (error) {
    await t.rollback();
    console.error('Bulk Delete Payments Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete all payments ──────────────────────────────────────────────────────
exports.bulkDeleteAllPayments = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Delete related receipts first
    await Receipt.destroy({ where: {}, transaction: t });

    const deletedCount = await Payment.destroy({ where: {}, transaction: t });

    await t.commit();

    await createAuditLog({
      userId: req.user.id,
      username: req.user.username,
      actionType: 'DELETE_ALL_PAYMENTS',
      recordCount: deletedCount,
      req
    });

    res.json({
      success: true,
      message: `All records (Payments: ${deletedCount}) cleared successfully`,
      data: { deletedCount }
    });
  } catch (error) {
    await t.rollback();
    console.error('Delete All Payments Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
