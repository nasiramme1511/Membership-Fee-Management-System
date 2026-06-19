// controllers/settingController.js - Settings Controller (MySQL / Sequelize)
const { v4: uuidv4 } = require('uuid');
const Setting = require('../models/Setting');
const Member  = require('../models/Member');
const SectorUnit = require('../models/SectorUnit');
const ClassificationEngine = require('../utils/classificationEngine');

const TAX_EXEMPT_UNIT_NAMES = ['Prosperity Party Dire Dawa Branch Office'];

// Get all settings (create defaults if none exist)
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();

    // Filter out branches without names
    if (req.body.branches) {
      req.body.branches = req.body.branches.filter(b => b.name && b.name.trim() !== '');
    }

    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      if (req.body.branches) {
        // Ensure existingBranches is always an array
        let existingBranches = settings.branches;
        if (typeof existingBranches === 'string') {
          try { existingBranches = JSON.parse(existingBranches); } catch { existingBranches = []; }
        }
        if (!Array.isArray(existingBranches)) existingBranches = [];

        const updatedBranches = Array.isArray(req.body.branches) ? req.body.branches : [];

        const newBranchIds = updatedBranches.filter(b => b._id).map(b => b._id);

        // Remove branches no longer in list
        let merged = existingBranches.filter(b => newBranchIds.includes(b._id));

        // Update or add
        for (const branchData of updatedBranches) {
          if (branchData._id) {
            const idx = merged.findIndex(b => b._id === branchData._id);
            if (idx !== -1) {
              merged[idx] = { ...merged[idx], ...branchData };
            } else {
              merged.push(branchData);
            }
          } else {
            merged.push({ _id: uuidv4(), ...branchData });
          }
        }
        settings.branches = merged;
        settings.changed('branches', true);
      }

      if (req.body.contributionRules) {
        settings.contributionRules = req.body.contributionRules;
        settings.changed('contributionRules', true);
      }
      if (req.body.distribution) {
        settings.distribution = req.body.distribution;
        settings.changed('distribution', true);
      }
      if (req.body.system) {
        settings.system = req.body.system;
        settings.changed('system', true);
      }

      await settings.save();
    }

    // Async recalculate in background so UI doesn't wait
    setImmediate(async () => {
      try {
        const allMembers = await Member.findAll();
        const freshSettings = await Setting.findOne();
        const allUnits = await SectorUnit.findAll();
        const exemptUnitIds = new Set(
          allUnits.filter(u => TAX_EXEMPT_UNIT_NAMES.includes(u.name)).map(u => u.id)
        );
        for (const member of allMembers) {
          try {
            const raw = member.toJSON();
            const memberData = {
              membershipType: raw.membershipType,
              sector: raw.sector,
              branch: raw.branch,
              wing: raw.wing,
              financial: {
                salary:          raw.financialSalary          || 0,
                employmentType:  raw.financialEmploymentType  || 'Private',
                occupationType:  raw.financialOccupationType  || 'Informal',
                income:          raw.financialIncome          || 0,
                employees:       raw.financialEmployees        || 0,
                capital:         raw.financialCapital          || 0,
                customMonthlyFee:raw.financialCustomMonthlyFee || null,
              }
            };
            const taxExempt = exemptUnitIds.has(raw.sectorUnitId);
            const cls = ClassificationEngine.autoClassifyAndCalculate(memberData, freshSettings, taxExempt);
            await member.update({
              contributionMonthlyFee:  cls.monthlyFee,
              contributionPercentage:  cls.percentage,
              contributionAnnualFee:   cls.annualFee,
              contributionHqShare:     cls.hqShare,
              contributionBranchShare: cls.branchShare,
            });
          } catch (_) {}
        }
      } catch (_) {}
    });

    res.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recalculate all member contributions
exports.recalculateAll = async (req, res) => {
  try {
    const members = await Member.findAll();
    let updated = 0;
    let errors  = 0;

    const settingsInfo = await Setting.findOne();
    const allUnits = await SectorUnit.findAll();
    const exemptUnitIds = new Set(
      allUnits.filter(u => TAX_EXEMPT_UNIT_NAMES.includes(u.name)).map(u => u.id)
    );
    for (const member of members) {
      try {
        const raw = member.toJSON();
        const memberData = {
          membershipType: raw.membershipType,
          sector: raw.sector,
          branch: raw.branch,
          subType: raw.subType,
          wing: raw.wing,
          financial: {
            salary: raw.financialSalary || 0,
            employmentType: raw.financialEmploymentType || 'Private',
            occupationType: raw.financialOccupationType || 'Informal',
            income: raw.financialIncome || 0,
            employees: raw.financialEmployees || 0,
            capital: raw.financialCapital || 0,
            customMonthlyFee: raw.financialCustomMonthlyFee || null
          }
        };
        const taxExempt = exemptUnitIds.has(raw.sectorUnitId);
        const classification = ClassificationEngine.autoClassifyAndCalculate(memberData, settingsInfo, taxExempt);
        await member.update({
          contributionMonthlyFee:  classification.monthlyFee,
          contributionPercentage:  classification.percentage,
          contributionAnnualFee:   classification.annualFee,
          contributionHqShare:     classification.hqShare,
          contributionBranchShare: classification.branchShare,
          netSalaryGrossSalary:      classification.netSalary?.grossSalary      || 0,
          netSalaryPensionDeduction: classification.netSalary?.pensionDeduction || 0,
          netSalaryTaxDeduction:     classification.netSalary?.taxDeduction     || 0,
          netSalaryTotalDeductions:  classification.netSalary?.totalDeductions  || 0,
          netSalaryNetSalary:        classification.netSalary?.netSalary        || 0,
          netSalaryContributionFee:  classification.netSalary?.contributionFee  || 0,
          netSalaryFinalNetSalary:   classification.netSalary?.finalNetSalary   || 0
        });
        updated++;
      } catch (err) {
        errors++;
      }
    }

    res.json({
      success: true,
      message: `Recalculated ${updated} members (${errors} errors)`,
      data: { updated, errors }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add branch
exports.addBranch = async (req, res) => {
  try {
    const settings = await Setting.findOne();
    if (!settings) return res.status(404).json({ success: false, message: 'Settings not found' });

    const branches = [...(settings.branches || [])];
    branches.push({ _id: uuidv4(), ...req.body });
    settings.branches = branches;
    settings.changed('branches', true);
    await settings.save();

    res.json({ success: true, message: 'Branch added', data: settings.branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update branch
exports.updateBranch = async (req, res) => {
  try {
    const settings = await Setting.findOne();
    if (!settings) return res.status(404).json({ success: false, message: 'Settings not found' });

    const branches = [...(settings.branches || [])];
    const idx = branches.findIndex(b => b._id === req.params.branchId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Branch not found' });

    branches[idx] = { ...branches[idx], ...req.body };
    settings.branches = branches;
    settings.changed('branches', true);
    await settings.save();

    res.json({ success: true, message: 'Branch updated', data: settings.branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete branch
exports.deleteBranch = async (req, res) => {
  try {
    const settings = await Setting.findOne();
    if (!settings) return res.status(404).json({ success: false, message: 'Settings not found' });

    const branches = (settings.branches || []).filter(b => b._id !== req.params.branchId);
    settings.branches = branches;
    settings.changed('branches', true);
    await settings.save();

    res.json({ success: true, message: 'Branch deleted', data: settings.branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
