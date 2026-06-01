// utils/i18n.js - Multi-language Support Utility
const path = require('path');
const fs = require('fs');

class I18nService {
  constructor() {
    this.translations = {};
    this.defaultLanguage = 'en';
    this.supportedLanguages = ['en', 'am']; // English, Amharic
    
    // Load translations
    this._loadTranslations();
  }

  /**
   * Load translation files
   */
  _loadTranslations() {
    const translationsDir = path.join(__dirname, '..', 'translations');
    
    if (!fs.existsSync(translationsDir)) {
      fs.mkdirSync(translationsDir, { recursive: true });
    }

    // Load each language file
    for (const lang of this.supportedLanguages) {
      const filePath = path.join(translationsDir, `${lang}.json`);
      
      if (fs.existsSync(filePath)) {
        this.translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        this.translations[lang] = {};
      }
    }

    // Create default translation files if they don't exist
    if (Object.keys(this.translations['en']).length === 0) {
      this.translations['en'] = this._getDefaultEnglishTranslations();
      fs.writeFileSync(
        path.join(translationsDir, 'en.json'),
        JSON.stringify(this.translations['en'], null, 2)
      );
    }

    if (Object.keys(this.translations['am']).length === 0) {
      this.translations['am'] = this._getDefaultAmharicTranslations();
      fs.writeFileSync(
        path.join(translationsDir, 'am.json'),
        JSON.stringify(this.translations['am'], null, 2)
      );
    }
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key (dot notation supported)
   * @param {string} lang - Language code
   * @param {Object} params - Dynamic parameters to replace
   * @returns {string} - Translated text
   */
  t(key, lang = 'en', params = {}) {
    const keys = key.split('.');
    let value = this.translations[lang] || this.translations['en'];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        value = this.translations['en'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }

    if (typeof value === 'string') {
      // Replace parameters
      let result = value;
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
      }
      return result;
    }

    return key;
  }

  /**
   * Get all translations for a language
   */
  getTranslations(lang = 'en') {
    return this.translations[lang] || this.translations['en'];
  }

  /**
   * Update translations
   */
  updateTranslations(lang, newTranslations) {
    if (!this.translations[lang]) {
      this.translations[lang] = {};
    }
    
    this.translations[lang] = { ...this.translations[lang], ...newTranslations };
    
    // Save to file
    const filePath = path.join(__dirname, '..', 'translations', `${lang}.json`);
    fs.writeFileSync(filePath, JSON.stringify(this.translations[lang], null, 2));
  }

  /**
   * Default English translations
   */
  _getDefaultEnglishTranslations() {
    return {
      // Common
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        filter: 'Filter',
        export: 'Export',
        import: 'Import',
        loading: 'Loading...',
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        confirm: 'Confirm',
        close: 'Close',
        next: 'Next',
        previous: 'Previous'
      },
      
      // Dashboard
      dashboard: {
        title: 'Dashboard',
        totalMembers: 'Total Members',
        activeMembers: 'Active Members',
        yearlyRevenue: 'Yearly Revenue',
        monthlyRevenue: 'Monthly Revenue',
        pendingPayments: 'Pending Payments',
        defaultedMembers: 'Defaulted Members',
        revenueGrowth: 'Revenue Growth',
        membersByType: 'Members by Type',
        membersByBranch: 'Members by Branch',
        revenueTrend: 'Revenue Trend',
        topContributors: 'Top Contributors',
        revenueByType: 'Revenue by Type',
        urbanVsRural: 'Urban vs Rural'
      },
      
      // Members
      members: {
        title: 'Members',
        addMember: 'Add Member',
        editMember: 'Edit Member',
        deleteMember: 'Delete Member',
        memberId: 'Member ID',
        fullName: 'Full Name',
        gender: 'Gender',
        phone: 'Phone',
        email: 'Email',
        branch: 'Branch',
        cluster: 'Cluster',
        sector: 'Sector',
        membershipType: 'Membership Type',
        subType: 'Sub Type',
        grossSalary: 'Gross Salary',
        netSalary: 'Net Salary',
        pension: 'Pension (7%)',
        tax: 'Income Tax',
        percentage: 'Percentage',
        monthlyFee: 'Monthly Fee',
        annualFee: 'Annual Fee',
        status: 'Status',
        paymentStatus: 'Payment Status',
        actions: 'Actions'
      },
      
      // Payments
      payments: {
        title: 'Payments',
        recordPayment: 'Record Payment',
        amount: 'Amount',
        method: 'Payment Method',
        frequency: 'Frequency',
        receiptId: 'Receipt ID',
        receivedBy: 'Received By',
        period: 'Period',
        cash: 'Cash',
        bankTransfer: 'Bank Transfer',
        mobileMoney: 'Mobile Money',
        check: 'Check'
      },
      
      // Reports
      reports: {
        title: 'Reports',
        monthlyRevenue: 'Monthly Revenue',
        yearlyRevenue: 'Yearly Revenue',
        hqBranchDistribution: 'HQ vs Branch Distribution',
        defaulterReport: 'Defaulter Report',
        exportAllData: 'Export All Data',
        totalRevenue: 'Total Revenue',
        totalPayments: 'Total Payments',
        averagePayment: 'Average Payment',
        totalDefaulters: 'Total Defaulters',
        totalOutstanding: 'Total Outstanding'
      },
      
      // Receipts
      receipts: {
        title: 'Receipts',
        officialReceipt: 'Official Payment Receipt',
        memberInformation: 'Member Information',
        paymentInformation: 'Payment Information',
        contributionDetails: 'Contribution Details',
        revenueDistribution: 'Revenue Distribution',
        hqShare: 'HQ Share',
        branchShare: 'Branch Share',
        generatedOn: 'Generated On'
      },
      
      // Settings
      settings: {
        title: 'Settings',
        contributionRules: 'Contribution Rules',
        branchManagement: 'Branch Management',
        systemSettings: 'System Settings',
        recalculateAll: 'Recalculate All',
        saveChanges: 'Save All Changes'
      },
      
      // Notifications
      notifications: {
        paymentReminder: 'Payment Reminder',
        paymentConfirmed: 'Payment Confirmed',
        defaulterAlert: 'Defaulter Alert',
        welcomeMessage: 'Welcome to Membership Fee Contribution For Prosperity Party Dire Dawa Branch Office'
      }
    };
  }

  /**
   * Default Amharic translations
   */
  _getDefaultAmharicTranslations() {
    return {
      // Common
      common: {
        save: 'አስቀምጥ',
        cancel: 'ሰርዝ',
        delete: 'ሰርዝ',
        edit: 'አስተካክል',
        add: 'ጨምር',
        search: 'ፈልግ',
        filter: 'አጣራ',
        export: 'ላክ',
        import: 'አስገባ',
        loading: 'በመጫን ላይ...',
        success: 'ተ成功了',
        error: 'ስህተት',
        warning: 'ማስጠንቀቂያ',
        confirm: 'አረጋግጥ',
        close: 'ዝጋ',
        next: 'ቀጣይ',
        previous: 'ቀዳሚ'
      },
      
      // Dashboard
      dashboard: {
        title: 'ዳሽቦርድ',
        totalMembers: 'ጠቅላላ አባላት',
        activeMembers: 'ንቁ አባላት',
        yearlyRevenue: 'ዓመታዊ ገቢ',
        monthlyRevenue: 'ወርሃዊ ገቢ',
        pendingPayments: 'በመጠባበቅ ላይ ክፍያዎች',
        defaultedMembers: 'ያልከፈሉ አባላት',
        revenueGrowth: 'የገቢ እድገት',
        membersByType: 'አባላት በዓይነት',
        membersByBranch: 'አባላት በቅርንጫፍ',
        revenueTrend: 'የገቢ ዝንባሌ',
        topContributors: 'ከፍተኛ አስተዋጽኦ አድራጊዎች',
        revenueByType: 'ገቢ በዓይነት',
        urbanVsRural: 'ናከተማ vs ከገጠር'
      },
      
      // Members
      members: {
        title: 'አባላት',
        addMember: 'አባል ጨምር',
        editMember: 'አባል አስተካክል',
        deleteMember: 'አባል ሰርዝ',
        memberId: 'አባል መታወቂያ',
        fullName: 'ሙሉ ስም',
        gender: 'ፆታ',
        phone: 'ስልክ',
        email: 'ኢሜይል',
        branch: 'ቅርንጫፍ',
        cluster: 'ክላስተር',
        sector: 'ዘርፍ',
        membershipType: 'የአባልነት ዓይነት',
        subType: 'ንዑስ ዓይነት',
        grossSalary: 'ጠቅላላ ደመወዝ',
        netSalary: 'የተጣራ ደመወዝ',
        pension: 'ጡረታ (7%)',
        tax: 'የገቢ ቀረጥ',
        percentage: 'መቶኛ',
        monthlyFee: 'ወርሃዊ ክፍያ',
        annualFee: 'ዓመታዊ ክፍያ',
        status: 'ሁኔታ',
        paymentStatus: 'የክፍያ ሁኔታ',
        actions: 'ተግባራት'
      },
      
      // Payments
      payments: {
        title: 'ክፍያዎች',
        recordPayment: 'ክፍያ መዝግብ',
        amount: 'መጠን',
        method: 'የክፍያ ዘዴ',
        frequency: 'ድግግሞሽ',
        receiptId: 'የደረሰጅ ቁጥር',
        receivedBy: 'የተቀበለ',
        period: 'ጊዜ',
        cash: 'ጥሬ ገንዘብ',
        bankTransfer: 'የባንክ ዝውውር',
        mobileMoney: 'ሞባይል ገንዘብ',
        check: 'ቼክ'
      },
      
      // Reports
      reports: {
        title: 'ሪፖርቶች',
        monthlyRevenue: 'ወርሃዊ ገቢ',
        yearlyRevenue: 'ዓመታዊ ገቢ',
        hqBranchDistribution: 'ዋና ጽ/ቤት vs ቅርንጫፍ ክፍፍል',
        defaulterReport: 'ያልከፈሉ ሪፖርት',
        exportAllData: 'ሁሉንም ውሂብ ላክ',
        totalRevenue: 'ጠቅላላ ገቢ',
        totalPayments: 'ጠቅላላ ክፍያዎች',
        averagePayment: 'አማካይ ክፍያ',
        totalDefaulters: 'ጠቅላላ ያልከፈሉ',
        totalOutstanding: 'ጠቅላላ ቀሪ'
      },
      
      // Receipts
      receipts: {
        title: 'ደረሰጆች',
        officialReceipt: 'ይፋዊ የክፍያ ደረሰጅ',
        memberInformation: 'የአባል መረጃ',
        paymentInformation: 'የክፍያ መረጃ',
        contributionDetails: 'የአስተዋጽኦ ዝርዝሮች',
        revenueDistribution: 'የገቢ ክፍፍል',
        hqShare: 'ዋና ጽ/ቤት ድርሻ',
        branchShare: 'ቅርንጫፍ ድርሻ',
        generatedOn: 'የተፈጠረ በ'
      },
      
      // Settings
      settings: {
        title: 'ቅንብሮች',
        contributionRules: 'የአስተዋጽኦ ህጎች',
        branchManagement: 'ቅርንጫፍ አስተዳደር',
        systemSettings: 'የስርአት ቅንብሮች',
        recalculateAll: 'ሁሉንም እንደገና አስላ',
        saveChanges: 'ሁሉንም ለውጦች አስቀምጥ'
      },
      
      // Notifications
      notifications: {
        paymentReminder: 'የክፍያ ማስታወሻ',
        paymentConfirmed: 'ክፍያ ተረጋግጓል',
        defaulterAlert: 'ያልከፈለ ማስጠንቀቂያ',
        welcomeMessage: 'እንኳን ወደ Membership Fee Contribution For Prosperity Party Dire Dawa Branch Office በደህና መጡ'
      }
    };
  }
}

// Export singleton instance
module.exports = new I18nService();
