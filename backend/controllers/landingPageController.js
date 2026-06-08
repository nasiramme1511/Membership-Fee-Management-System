const LandingPageImage = require('../models/LandingPageImage');
const LandingPageContent = require('../models/LandingPageContent');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const SectorUnit = require('../models/SectorUnit');
const path = require('path');
const fs = require('fs');

const { getEthiopianYear, getEthiopianMonth } = require('../utils/ethiopianCalendar');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'landing');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

exports.getPublicContent = async (req, res) => {
  try {
    const entries = await LandingPageContent.findAll();
    const contentMap = {};
    entries.forEach(e => { contentMap[e.key] = e.value; });

    const images = await LandingPageImage.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({ success: true, data: { content: contentMap, images } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGallery = async (req, res) => {
  try {
    const images = await LandingPageImage.findAll({
      where: { isActive: true, category: ['gallery', 'event'] },
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLandingStats = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const currentYear = getEthiopianYear();
    const currentMonth = getEthiopianMonth();

    const [totalMembersRow] = await sequelize.query('SELECT COUNT(*) AS cnt FROM members WHERE status = \'Active\'', { type: Q });
    const [totalPaymentsRow] = await sequelize.query('SELECT COUNT(*) AS cnt FROM payments WHERE status = \'Paid\'', { type: Q });
    const [totalRevenueRow] = await sequelize.query('SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = \'Paid\'', { type: Q });
    const [sectorsRow] = await sequelize.query('SELECT COUNT(*) AS cnt FROM sector_units', { type: Q });
    const [monthlyPaidRow] = await sequelize.query('SELECT COUNT(DISTINCT memberDbId) AS cnt FROM payments WHERE periodYear = ? AND periodMonth = ? AND status = \'Paid\'', { replacements: [currentYear, currentMonth], type: Q });

    const totalMembers = Number(totalMembersRow?.cnt) || 0;
    const totalPayments = Number(totalPaymentsRow?.cnt) || 0;
    const totalRevenue = Number(totalRevenueRow?.total) || 0;
    const totalSectors = Number(sectorsRow?.cnt) || 0;
    
    let paidThisMonth = Number(monthlyPaidRow?.cnt) || 0;
    let targetYear = currentYear;
    let targetMonth = currentMonth;

    // Smart fallback: If the current month has zero payments recorded, display the stats for the most recent active month
    if (paidThisMonth === 0) {
      const [latestPeriodRow] = await sequelize.query('SELECT periodYear, periodMonth FROM payments WHERE status = \'Paid\' ORDER BY periodYear DESC, periodMonth DESC LIMIT 1', { type: Q });
      if (latestPeriodRow) {
        targetYear = latestPeriodRow.periodYear;
        targetMonth = latestPeriodRow.periodMonth;
        const [fallbackPaidRow] = await sequelize.query('SELECT COUNT(DISTINCT memberDbId) AS cnt FROM payments WHERE periodYear = ? AND periodMonth = ? AND status = \'Paid\'', { replacements: [targetYear, targetMonth], type: Q });
        paidThisMonth = Number(fallbackPaidRow?.cnt) || 0;
      }
    }

    const collectionRate = totalMembers > 0 ? Math.round((paidThisMonth / totalMembers) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalMembers,
        totalPayments,
        totalRevenue,
        totalSectors,
        paidThisMonth,
        collectionRate,
        statsPeriod: { year: targetYear, month: targetMonth }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const imagePath = '/uploads/landing/' + req.file.filename;
    const image = await LandingPageImage.create({
      title: req.body.title || '',
      description: req.body.description || '',
      image: imagePath,
      category: req.body.category || 'gallery',
      displayOrder: req.body.displayOrder || 0,
      uploadedBy: req.userId
    });

    res.json({ success: true, message: 'Image uploaded successfully', data: image });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'updates object required' });
    }

    for (const [key, value] of Object.entries(updates)) {
      const existing = await LandingPageContent.findOne({ where: { key } });
      if (existing) {
        existing.value = String(value);
        existing.updatedBy = req.userId;
        await existing.save();
      } else {
        await LandingPageContent.create({ key, value: String(value), updatedBy: req.userId });
      }
    }

    const entries = await LandingPageContent.findAll();
    const contentMap = {};
    entries.forEach(e => { contentMap[e.key] = e.value; });

    res.json({ success: true, message: 'Content updated', data: contentMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateImage = async (req, res) => {
  try {
    const image = await LandingPageImage.findByPk(req.params.id);
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

    if (req.body.title !== undefined) image.title = req.body.title;
    if (req.body.description !== undefined) image.description = req.body.description;
    if (req.body.category !== undefined) image.category = req.body.category;
    if (req.body.displayOrder !== undefined) image.displayOrder = req.body.displayOrder;
    if (req.body.isActive !== undefined) image.isActive = req.body.isActive;

    await image.save();
    res.json({ success: true, message: 'Image updated', data: image });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const image = await LandingPageImage.findByPk(req.params.id);
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

    const filePath = path.join(__dirname, '..', image.image);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await image.destroy();
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllImages = async (req, res) => {
  try {
    const images = await LandingPageImage.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
