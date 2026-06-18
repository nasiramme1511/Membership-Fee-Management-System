// utils/classificationEngine.js - Member Classification & Contribution Calculation
const Member = require('../models/Member');

/**
 * Classification Engine
 * Automatically classifies members and calculates contributions
 */
class ClassificationEngine {
  
  /**
   * Classify member based on input data
   */
  static classifyMember(memberData, settings = null) {
    const { membershipType, financial = {}, wing, branch, sector, manualFinancial } = memberData;
    let subType = null;
    let classificationRuleId = null;
    let monthlyFee = 0;
    let percentage = 0;
    let currency = 'ETB';

    const rules = settings?.contributionRules || null;

    // Determine subType and calculate fees
    switch (membershipType) {
      case 'Salary-Based':
        const salaryClass = this.classifySalaryBased(financial, rules, manualFinancial);
        subType = salaryClass.subType;
        percentage = salaryClass.percentage;
        monthlyFee = salaryClass.monthlyFee;
        currency = salaryClass.currency;
        classificationRuleId = salaryClass.ruleId;
        break;

      case 'Non-Salary':
        const nonSalaryClass = this.classifyNonSalary(financial, rules);
        subType = nonSalaryClass.subType;
        monthlyFee = nonSalaryClass.monthlyFee;
        classificationRuleId = nonSalaryClass.ruleId;
        break;

      case 'Student':
        subType = 'Student';
        monthlyFee = rules?.fixedFees?.student ?? 1; // Settings override
        classificationRuleId = 'STUDENT-FIXED';
        break;

      case 'Business':
        const businessClass = this.classifyBusiness(financial, rules);
        subType = businessClass.subType;
        monthlyFee = businessClass.monthlyFee;
        classificationRuleId = businessClass.ruleId;
        break;

      case 'Investor':
        const investorClass = this.classifyInvestor(financial, rules);
        subType = 'Investor';
        monthlyFee = investorClass.monthlyFee;
        classificationRuleId = investorClass.ruleId;
        break;

      case 'Wing': {
        const wingOccupation = financial.occupationType || '';
        const wingSalary     = financial.salary || 0;
        const wSettings      = rules?.wing || {};
        const wTypeName      = String(wing?.wingType || '').toLowerCase();
        
        subType = wing?.wingType || wingOccupation || 'General';

        // Article 7b (Salary) only if the category name contains 'employee'
        const isEmployeeWing = wTypeName.includes('employee');

        if (isEmployeeWing) {
          // Article 7b: Salary-based tiers for Employee Wings
          if (wingSalary <= 3000)       monthlyFee = wSettings.salary_1k_3k  ?? 2;
          else if (wingSalary <= 5000)  monthlyFee = wSettings.salary_3k_5k  ?? 5;
          else if (wingSalary <= 10000) monthlyFee = wSettings.salary_5k_10k ?? 10;
          else                          monthlyFee = wSettings.salary_10k_plus ?? 20;
          classificationRuleId = `WING-EMPLOYEE-SAL-${monthlyFee}BIRR`;
        } else {
          // Article 8: Occupation-based tiers (no salary or salary < 1000)
          const occ = wingOccupation.toLowerCase();
          if (occ.includes('farm') || occ.includes('pastor')) {
            // 8a: Farmer/Pastoral → 1 Birr/month
            monthlyFee = wSettings.farmer ?? 1;
            classificationRuleId = 'WING-FARMER';
          } else if (occ.includes('informal')) {
            // 8b: Informal → 1 Birr/month
            monthlyFee = wSettings.informal ?? 1;
            classificationRuleId = 'WING-INFORMAL';
          } else if (occ.includes('micro') || occ.includes('small')) {
            // 8c: Micro/Small enterprise → 2 Birr/month
            monthlyFee = wSettings.micro_small ?? 2;
            classificationRuleId = 'WING-MICRO-SMALL';
          } else {
            // 8d: General → 10 Birr per month
            monthlyFee = wSettings.general ?? 10;
            classificationRuleId = 'WING-GENERAL';
          }
        }
        break;
      }

      default:
        monthlyFee = 5; // Default fee
        classificationRuleId = 'DEFAULT-001';
    }

    // Calculate annual fee and distribution
    const annualFee = Math.round(monthlyFee * 12);

    const dist = settings?.distribution || { hqPercentage: 20, branchPercentage: 80 };
    const hqShare = Math.round(annualFee * (dist.hqPercentage / 100));
    const branchShare = Math.round(annualFee * (dist.branchPercentage / 100));

    // Determine cluster based on sector
    const cluster = ClassificationEngine.determineCluster(sector);

    return {
      subType,
      classificationRuleId,
      monthlyFee,
      percentage,
      annualFee,
      hqShare,
      branchShare,
      currency,
      cluster
    };
  }

  /**
   * Determine cluster based on sector
   */
  static determineCluster(sector) {
    const urbanSectors = [
      'Kebele', 'Government Office', 'Public Institution', 'Health Facility',
      'Education Institution', 'Micro Enterprise', 'Small Business', 'Medium Business',
      'Market', 'Private Company', 'NGO', 'Bank', 'Factory', 'Embassy'
    ];
    const ruralSectors = [
      'Woreda', 'Farming', 'Pastoral', 'Agro Activity', 'Cooperative',
      'Local Market', 'Labor', 'Informal Work', 'Self Employed', 'Rural School', 'Health Post'
    ];

    if (urbanSectors.includes(sector)) return 'Urban';
    if (ruralSectors.includes(sector)) return 'Rural';
    return 'N/A';
  }

  /**
   * Classify Salary-Based Members
   */
  static classifySalaryBased(financial, rules, manualFinancial = null) {
    const salary = financial.salary || 0;
    const employmentType = financial.employmentType || 'Private';
    let percentage = 0;
    let monthlyFee = 0;

    // Determine calculation base (Gross or Net) from settings
    const calcBase = rules?.salaryBased?.calculationBase || 'Net';

    // Calculate net salary (after pension & tax)
    const netSalaryData = ClassificationEngine.calculateNetSalary(salary, rules);
    const netSalary = netSalaryData.netSalary;

    // Choose which salary to use for both bracket lookup AND fee calculation
    const salaryToUse = (calcBase === 'Net') ? netSalary : salary;

    const brackets = rules?.salaryBased?.[employmentType.toLowerCase()] || rules?.salaryBased?.private || [];

    if (brackets.length > 0) {
      for (const bracket of brackets) {
        if (salaryToUse >= bracket.minSalary && salaryToUse <= bracket.maxSalary) {
          percentage = bracket.percentage;
          break;
        }
      }
      if (!percentage && salaryToUse > brackets[brackets.length - 1].maxSalary) {
        percentage = brackets[brackets.length - 1].percentage;
      }
    } else {
      // Fallback
      if (salaryToUse <= 4000) percentage = 0.6;
      else if (salaryToUse <= 5000) percentage = 0.8;
      else if (salaryToUse <= 6000) percentage = 1.0;
      else if (salaryToUse <= 7000) percentage = 1.2;
      else if (salaryToUse <= 8000) percentage = 1.4;
      else if (salaryToUse <= 9000) percentage = 1.6;
      else if (salaryToUse <= 10000) percentage = 1.8;
      else percentage = 2.0;
    }
    
    // Override percentage if manually provided (e.g. from Excel)
    if (manualFinancial && manualFinancial.percentage) {
      percentage = Number(manualFinancial.percentage);
    }

    // Apply percentage to the chosen salary base
    monthlyFee = salaryToUse * (percentage / 100);

    // Override monthly fee if manually provided
    if (manualFinancial && manualFinancial.monthlyFee) {
      monthlyFee = Number(manualFinancial.monthlyFee);
    }

    return {
      subType: employmentType,
      percentage,
      monthlyFee,
      currency: 'ETB',
      ruleId: `SAL-STD-${percentage}%`
    };
  }

  /**
   * Classify Non-Salary Members
   */
  static classifyNonSalary(financial, rules) {
    const occupationType = financial.occupationType || 'Informal';
    let monthlyFee = 5;

    const key = occupationType.toLowerCase();
    monthlyFee = rules?.fixedFees?.[key] ?? 5;

    return {
      subType: occupationType,
      monthlyFee,
      ruleId: `NON-SAL-${occupationType.toUpperCase().substring(0, 3)}`
    };
  }

  /**
   * Classify Business Members
   */
  static classifyBusiness(financial, rules) {
    const income = financial.income || 0;
    const businessType = financial.businessType || financial.occupationType || 'Micro';
    let subType = 'Micro';
    let monthlyFee = rules?.business?.micro ?? 5;

    const type = businessType.toLowerCase();
    if (type.includes('micro')) {
      subType = 'Micro';
      monthlyFee = rules?.business?.micro ?? 5;
    } else if (type.includes('small')) {
      subType = 'Small';
      monthlyFee = rules?.business?.small ?? 10;
    } else if (type.includes('medium')) {
      subType = 'Medium';
      monthlyFee = rules?.business?.medium ?? 20;
    } else if (income > 0) {
      // Fallback to income-based if no clear type but income is provided
      if (income <= 50000) {
        subType = 'Micro';
        monthlyFee = rules?.business?.micro ?? 5;
      } else if (income <= 250000) {
        subType = 'Small';
        monthlyFee = rules?.business?.small ?? 10;
      } else {
        subType = 'Medium';
        monthlyFee = rules?.business?.medium ?? 20;
      }
    } else {
      // Absolute default
      subType = 'Micro';
      monthlyFee = rules?.business?.micro ?? 5;
    }

    return {
      subType,
      monthlyFee,
      ruleId: `BUS-${subType.toUpperCase()}`
    };
  }

  /**
   * Classify Investor Members
   */
  static classifyInvestor(financial, rules) {
    const capital = financial.capital || 0;
    let monthlyFee = 500;
    let ruleId = '';

    const investorRules = rules?.investor || [];
    
    if (investorRules.length > 0) {
      for (const bracket of investorRules) {
        if (capital >= bracket.minCapital && capital <= bracket.maxCapital) {
          monthlyFee = bracket.fee;
          ruleId = `INV-${bracket.fee}`;
          break;
        }
      }
      if (!ruleId) {
        monthlyFee = investorRules[investorRules.length - 1].fee;
        ruleId = `INV-MAX`;
      }
    } else {
      // Fallback
      if (capital <= 5000000) {
        monthlyFee = 500;
        ruleId = 'INV-5M';
      } else if (capital <= 10000000) {
        monthlyFee = 1000;
        ruleId = 'INV-10M';
      } else {
        monthlyFee = 2000;
        ruleId = 'INV-10M+';
      }
    }

    return {
      monthlyFee,
      ruleId
    };
  }

  /**
   * Calculate Ethiopian Income Tax
   * Based on Ethiopian tax brackets
   */
  static calculateIncomeTax(salary, rules = null) {
    const taxBrackets = rules?.salaryBased?.taxBrackets;
    
    if (taxBrackets && Array.isArray(taxBrackets) && taxBrackets.length > 0) {
      // Sort brackets by threshold ascending
      const sorted = [...taxBrackets].sort((a, b) => a.threshold - b.threshold);
      
      // Find the applicable bracket
      let appliedBracket = sorted[sorted.length - 1];
      for (const b of sorted) {
        if (salary <= b.threshold) {
          appliedBracket = b;
          break;
        }
      }
      
      const tax = (salary * (appliedBracket.rate || 0)) - (appliedBracket.deduction || 0);
      return Math.max(0, tax);
    }

    // Updated monthly income tax brackets (Fallback)
    if (salary <= 2000) return 0;
    if (salary <= 4000) return (salary * 0.15) - 300;
    if (salary <= 7000) return (salary * 0.20) - 500;
    if (salary <= 10000) return (salary * 0.25) - 850;
    if (salary <= 14000) return (salary * 0.30) - 1350;
    return (salary * 0.35) - 2050;
  }

  /**
   * Calculate Pension Deduction
   */
  static calculatePension(salary, rules = null) {
    const percentage = rules?.salaryBased?.pensionPercentage ?? 7;
    return salary * (percentage / 100);
  }

  /**
   * Calculate Net Salary after all deductions
   */
  static calculateNetSalary(salary, rules = null, taxExempt = false) {
    const grossSalary = salary;
    const pensionDeduction = this.calculatePension(salary, rules);
    const taxDeduction = taxExempt ? 0 : this.calculateIncomeTax(salary, rules);
    const totalDeductions = pensionDeduction + taxDeduction;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return {
      grossSalary,
      pensionDeduction,
      taxDeduction,
      totalDeductions,
      netSalary
    };
  }

  /**
   * Auto-classify and calculate for a member
   */
  static autoClassifyAndCalculate(memberData, settings = null, taxExempt = false) {
    const classification = this.classifyMember(memberData, settings);
    
    // Sub-Articles 10 & 11: Member may voluntarily pay more than standard fee
    if (memberData.financial && memberData.financial.customMonthlyFee) {
      const customFee = Number(memberData.financial.customMonthlyFee);
      if (customFee >= classification.monthlyFee) {
        classification.monthlyFee = customFee;
        classification.annualFee = customFee * 12;
        classification.hqShare = Math.round(classification.annualFee * 0.20);
        classification.branchShare = Math.round(classification.annualFee * 0.80);
      }
    }

    const salary = memberData.financial?.salary || 0;
    const netSalaryData = this.calculateNetSalary(salary, settings, taxExempt);
    
    // Manual overrides for deductions if provided
    if (memberData.manualFinancial) {
      if (memberData.manualFinancial.taxDeduction !== undefined && !isNaN(memberData.manualFinancial.taxDeduction)) {
        netSalaryData.taxDeduction = memberData.manualFinancial.taxDeduction;
      }
      if (memberData.manualFinancial.pensionDeduction !== undefined && !isNaN(memberData.manualFinancial.pensionDeduction)) {
        netSalaryData.pensionDeduction = memberData.manualFinancial.pensionDeduction;
      }
      if (memberData.manualFinancial.netSalary !== undefined && !isNaN(memberData.manualFinancial.netSalary)) {
        netSalaryData.netSalary = memberData.manualFinancial.netSalary;
      }
      netSalaryData.totalDeductions = netSalaryData.pensionDeduction + netSalaryData.taxDeduction;
    }

    const finalNetSalary = Math.max(0, netSalaryData.netSalary - classification.monthlyFee);

    return {
      ...classification,
      netSalary: {
        ...netSalaryData,
        contributionFee: classification.monthlyFee,
        finalNetSalary
      }
    };
  }
}

module.exports = ClassificationEngine;
