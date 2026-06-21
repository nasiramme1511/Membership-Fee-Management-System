// models/Setting.js - System Settings Model (Sequelize / MySQL)
// The complex nested structures (contributionRules, branches, distribution, system)
// are stored as JSON columns — easiest approach for heavily nested config data.
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_CONTRIBUTION_RULES = {
  salaryBased: {
    calculationBase: 'Net', // 'Net' or 'Gross'
    pensionPercentage: 7,
    taxBrackets: [
      { threshold: 2000, rate: 0,    deduction: 0    },
      { threshold: 4000, rate: 0.15, deduction: 300  },
      { threshold: 7000, rate: 0.20, deduction: 500  },
      { threshold: 10000, rate: 0.25, deduction: 850 },
      { threshold: 14000, rate: 0.30, deduction: 1350 },
      { threshold: 9999999, rate: 0.35, deduction: 2050 }
    ],
    government: [
      { minSalary: 0,     maxSalary: 4000,      percentage: 0.6 },
      { minSalary: 4001,  maxSalary: 5000,      percentage: 0.8 },
      { minSalary: 5001,  maxSalary: 6000,      percentage: 1.0 },
      { minSalary: 6001,  maxSalary: 7000,      percentage: 1.2 },
      { minSalary: 7001,  maxSalary: 8000,      percentage: 1.4 },
      { minSalary: 8001,  maxSalary: 9000,      percentage: 1.6 },
      { minSalary: 9001,  maxSalary: 10000,     percentage: 1.8 },
      { minSalary: 10001, maxSalary: 999999999, percentage: 2.0 }
    ],
    private: [
      { minSalary: 0,     maxSalary: 4000,      percentage: 0.6 },
      { minSalary: 4001,  maxSalary: 5000,      percentage: 0.8 },
      { minSalary: 5001,  maxSalary: 6000,      percentage: 1.0 },
      { minSalary: 6001,  maxSalary: 7000,      percentage: 1.2 },
      { minSalary: 7001,  maxSalary: 8000,      percentage: 1.4 },
      { minSalary: 8001,  maxSalary: 9000,      percentage: 1.6 },
      { minSalary: 9001,  maxSalary: 10000,     percentage: 1.8 }
    ],
    ngo: [
       { minSalary: 0,     maxSalary: 4000,      percentage: 0.6 },
       { minSalary: 4001,  maxSalary: 5000,      percentage: 0.8 },
       { minSalary: 5001,  maxSalary: 6000,      percentage: 1.0 },
       { minSalary: 6001,  maxSalary: 7000,      percentage: 1.2 },
       { minSalary: 7001,  maxSalary: 8000,      percentage: 1.4 },
       { minSalary: 8001,  maxSalary: 9000,      percentage: 1.6 },
       { minSalary: 9001,  maxSalary: 10000,     percentage: 1.8 }
    ]
  },
  fixedFees: {
    student:     1,
    farmer:      5,
    resident:    5,
    pastoralist: 5,
    labor:       5,
    informal:    5
  },
  business: { micro: 5, small: 10, medium: 20 },
  investor: [
    { minCapital: 0,        maxCapital: 5000000,      fee: 500  },
    { minCapital: 5000001,  maxCapital: 10000000,     fee: 1000 },
    { minCapital: 10000001, maxCapital: 999999999999, fee: 2000 }
  ],
  wing: {
    // Article 7b - Salary-based Wing tiers
    salary_1k_3k:   2,   // 1,000–3,000 Birr income → 2 Birr/month
    salary_3k_5k:   5,   // 3,001–5,000 Birr income → 5 Birr/month
    salary_5k_10k:  10,  // 5,001–10,000 Birr income → 10 Birr/month
    salary_10k_plus: 20, // >10,000 Birr income → 20 Birr/month
    // Article 8 - Occupation-based Wing tiers
    farmer:      1,  // 8a: Farmer/Pastoral → 1 Birr/month
    informal:    1,  // 8b: Informal activities → 1 Birr/month
    micro_small: 2,  // 8c: Micro/Small enterprise → 2 Birr/month
    general_annual: 10   // 8d: General Wing → 10 Birr/year
  }
};

const DEFAULT_DISTRIBUTION = { hqPercentage: 20, branchPercentage: 80 };

const DEFAULT_BRANCHES = [
  { _id: uuidv4(), name: 'Dire Dawa Main', code: 'MAIN', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Kebele 01', code: 'K01', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Kebele 02', code: 'K02', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Kebele 03', code: 'K03', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Kebele 04', code: 'K04', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Kebele 05', code: 'K05', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Kebele 06', code: 'K06', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Kebele 07', code: 'K07', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Kebele 08', code: 'K08', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Kebele 09', code: 'K09', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Kebele 10', code: 'K10', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Women Wing', code: 'WOMEN', cluster: 'Urban', isActive: true },
  { _id: uuidv4(), name: 'Youth Wing', code: 'YOUTH', cluster: 'Urban', isActive: true }
];

const DEFAULT_SYSTEM = {
  organizationName:        'Dire Dawa City Administration Finance Bureau',
  currency:                'ETB',
  fiscalYearStart:         1,
  defaultLanguage:         'en',
  enableSmsNotifications:  false,
  enableEmailNotifications:false,
  defaulterThreshold:      3,
  receiptPrefix:           'RCP'
};

const Setting = sequelize.define('Setting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  contributionRules: { type: DataTypes.JSON, defaultValue: DEFAULT_CONTRIBUTION_RULES },
  distribution:      { type: DataTypes.JSON, defaultValue: DEFAULT_DISTRIBUTION },
  branches:          { type: DataTypes.JSON, defaultValue: DEFAULT_BRANCHES },
  system:            { type: DataTypes.JSON, defaultValue: DEFAULT_SYSTEM }
}, {
  tableName: 'settings',
  timestamps: true
});

Setting.prototype.toJSON = function () {
  const v = Object.assign({}, this.get());
  v._id = v.id;
  
  // Safely parse JSON columns if MySQL returns them as strings
  if (typeof v.contributionRules === 'string') {
    try { v.contributionRules = JSON.parse(v.contributionRules); } catch(e){}
  }
  if (typeof v.distribution === 'string') {
    try { v.distribution = JSON.parse(v.distribution); } catch(e){}
  }
  if (typeof v.branches === 'string') {
    try { v.branches = JSON.parse(v.branches); } catch(e){}
  }
  if (typeof v.system === 'string') {
    try { v.system = JSON.parse(v.system); } catch(e){}
  }
  
  return v;
};

module.exports = Setting;
