// models/Member.js - Member Model (Sequelize / MySQL)
// Nested MongoDB fields are flattened to columns.
// toJSON() reconstructs the nested structure expected by the frontend/controllers.
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Member = sequelize.define('Member', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  memberId: {
    type: DataTypes.STRING(50),
    unique: true
  },

  // ── Personal ────────────────────────────────────────────────────────────────
  fullName:   { type: DataTypes.STRING(255), allowNull: false },
  gender:     { type: DataTypes.ENUM('Male', 'Female'), allowNull: false },
  age:        { type: DataTypes.INTEGER, allowNull: true },
  phone:      { type: DataTypes.STRING(50), allowNull: false },
  email:      { type: DataTypes.STRING(255), allowNull: true },
  nationalId: { type: DataTypes.STRING(100), allowNull: true },

  // ── Address (flattened) ─────────────────────────────────────────────────────
  addressRegion: { type: DataTypes.STRING(100), defaultValue: 'Dire Dawa' },
  addressCity:   { type: DataTypes.STRING(100), defaultValue: 'Dire Dawa' },
  addressWoreda: { type: DataTypes.STRING(100), allowNull: false, defaultValue: '01' },

  // ── Sector / Unit / Category ──────────────────────────────────────────────
  sectorUnitId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'sector_units', key: 'id' }
  },
  memberCategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'member_categories', key: 'id' }
  },
  // ── Legacy (to be removed or mapped) ───────────────────────────────────────
  branch:  { type: DataTypes.STRING(100), allowNull: true },
  cluster: { type: DataTypes.ENUM('Urban', 'Rural', 'Institution', 'N/A'), defaultValue: 'N/A' },
  sector:  { type: DataTypes.STRING(100), allowNull: true },

  // ── Classification ──────────────────────────────────────────────────────────
  membershipType: {
    type: DataTypes.ENUM('Salary-Based', 'Non-Salary', 'Student', 'Business', 'Investor', 'Special', 'Wing'),
    allowNull: false
  },
  subType: { type: DataTypes.STRING(100), allowNull: true },
  classificationRuleId: { type: DataTypes.STRING(100), allowNull: true },

  // ── Financial (flattened) ───────────────────────────────────────────────────
  financialSalary:          { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  financialEmploymentType:  { type: DataTypes.STRING(100), allowNull: true },
  financialCurrency:        { type: DataTypes.ENUM('ETB', 'USD'), defaultValue: 'ETB' },
  financialAllowances:      { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  financialOccupationType:  { type: DataTypes.STRING(100), allowNull: true },
  financialEstimatedIncome: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  financialBusinessType:    { type: DataTypes.STRING(100), allowNull: true },
  financialBusinessName:    { type: DataTypes.STRING(255), allowNull: true },
  financialEmployees:       { type: DataTypes.INTEGER, defaultValue: 0 },
  financialIncome:          { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  financialCapital:         { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  financialInvestmentType:  { type: DataTypes.STRING(100), allowNull: true },

  financialCustomMonthlyFee:{ type: DataTypes.DECIMAL(15, 2), allowNull: true },

  // ── Wing ────────────────────────────────────────────────────────────────────
  wingType:           { type: DataTypes.STRING(100), allowNull: true },
  wingParentMemberId: { type: DataTypes.STRING(50), allowNull: true },

  // ── Membership Details ──────────────────────────────────────────────────────
  registrationDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Suspended', 'Defaulted'),
    defaultValue: 'Active'
  },

  // ── Calculated Contribution (flattened) ─────────────────────────────────────
  contributionMonthlyFee:  { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  contributionPercentage:  { type: DataTypes.DECIMAL(10, 4), defaultValue: 0 },
  contributionAnnualFee:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  contributionHqShare:     { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  contributionBranchShare: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },

  // ── Net Salary (flattened) ──────────────────────────────────────────────────
  netSalaryGrossSalary:       { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  netSalaryPensionDeduction:  { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  netSalaryTaxDeduction:      { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  netSalaryTotalDeductions:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  netSalaryNetSalary:         { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  netSalaryContributionFee:   { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  netSalaryFinalNetSalary:    { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },

  // ── Payment Schedule ─────────────────────────────────────────────────────────
  // Stored as JSON array; each element: { month, year, expectedDate, status,
  //                                        actualPaymentDate, paymentId }
  paymentSchedule: { type: DataTypes.JSON, defaultValue: [] },

  paymentStatus: {
    type: DataTypes.ENUM('Paid', 'Unpaid', 'Partial', 'Overpaid', 'Defaulted'),
    defaultValue: 'Unpaid'
  },

  importedFrom: { type: DataTypes.STRING(255), allowNull: true }

}, {
  tableName: 'members',
  timestamps: true,
  indexes: [
    { fields: ['memberId'] },
    { fields: ['phone'] },
    { fields: ['branch', 'membershipType'] },
    { fields: ['status', 'paymentStatus'] }
  ]
});

// ── beforeCreate: auto-generate memberId with duplicate check ──────────────
Member.beforeCreate(async (member) => {
  if (!member.memberId) {
    const { generateMemberId } = require('../utils/memberIdGenerator');
    member.memberId = await generateMemberId();
  } else {
    const existing = await Member.findOne({ where: { memberId: member.memberId }, attributes: ['id'] });
    if (existing) {
      throw new Error(`Member ID "${member.memberId}" is already taken.`);
    }
  }
});

// ── toJSON: reconstruct nested objects expected by frontend / classificationEngine
Member.prototype.toJSON = function () {
  const v = Object.assign({}, this.get());

  v._id = v.id; // backward compat with any frontend using _id

  v.address = {
    region: v.addressRegion,
    city:   v.addressCity,
    woreda: v.addressWoreda
  };

  v.financial = {
    salary:          Number(v.financialSalary)          || 0,
    employmentType:  v.financialEmploymentType,
    currency:        v.financialCurrency,
    allowances:      Number(v.financialAllowances)      || 0,
    occupationType:  v.financialOccupationType,
    estimatedIncome: Number(v.financialEstimatedIncome) || 0,
    businessType:    v.financialBusinessType,
    businessName:    v.financialBusinessName,
    employees:       Number(v.financialEmployees)       || 0,
    income:          Number(v.financialIncome)          || 0,
    capital:         Number(v.financialCapital)         || 0,
    investmentType:  v.financialInvestmentType,
    customMonthlyFee:v.financialCustomMonthlyFee ? Number(v.financialCustomMonthlyFee) : null
  };

  v.contribution = {
    monthlyFee:  Number(v.contributionMonthlyFee)  || 0,
    percentage:  Number(v.contributionPercentage)  || 0,
    annualFee:   Number(v.contributionAnnualFee)   || 0,
    hqShare:     Number(v.contributionHqShare)     || 0,
    branchShare: Number(v.contributionBranchShare) || 0
  };

  v.netSalary = {
    grossSalary:      Number(v.netSalaryGrossSalary)      || 0,
    pensionDeduction: Number(v.netSalaryPensionDeduction) || 0,
    taxDeduction:     Number(v.netSalaryTaxDeduction)     || 0,
    totalDeductions:  Number(v.netSalaryTotalDeductions)  || 0,
    netSalary:        Number(v.netSalaryNetSalary)        || 0,
    contributionFee:  Number(v.netSalaryContributionFee)  || 0,
    finalNetSalary:   Number(v.netSalaryFinalNetSalary)   || 0
  };

  v.wing = {
    wingType:       v.wingType,
    parentMemberId: v.wingParentMemberId
  };

  v.branch = v.sectorUnit?.name || v.sector || v.branch;

  return v;
};

const SectorUnit = require('./SectorUnit');
const MemberCategory = require('./MemberCategory');

Member.belongsTo(SectorUnit, { foreignKey: 'sectorUnitId', as: 'sectorUnit' });
Member.belongsTo(MemberCategory, { foreignKey: 'memberCategoryId', as: 'memberCategory' });

module.exports = Member;
