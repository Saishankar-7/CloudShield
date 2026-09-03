const PDFDocument = require('pdfkit');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const Resource = require('../models/Resource');
const logger = require('../utils/logger');

// Realistic Synthetic Employee Dataset for Enterprise HR Directory
const SYNTHETIC_EMPLOYEES = [
  {
    employeeId: 'EMP-2025-0101',
    fullName: 'Sai Kumar',
    jobTitle: 'Senior Software Engineer',
    department: 'Engineering',
    email: 'sai@company.com',
    phone: '+91 98765 43210',
    salary: '$138,000',
    annualCompensation: '₹28,50,000',
    securityClearance: 'Level 4 (Top Secret)',
    location: 'Mumbai, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2022-03-15',
    manager: 'Ravi Teja',
    performanceRating: '4.9 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0102',
    fullName: 'Priya Sharma',
    jobTitle: 'Principal Cloud Architect',
    department: 'Engineering',
    email: 'priya.sharma@company.com',
    phone: '+91 98112 34567',
    salary: '$165,000',
    annualCompensation: '₹34,00,000',
    securityClearance: 'Level 5 (Superuser Clearance)',
    location: 'Bangalore, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2021-06-10',
    manager: 'Ravi Teja',
    performanceRating: '4.95 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0103',
    fullName: 'Ravi Teja',
    jobTitle: 'VP of Global Engineering',
    department: 'Engineering',
    email: 'ravi.teja@company.com',
    phone: '+91 98450 11223',
    salary: '$225,000',
    annualCompensation: '₹48,00,000',
    securityClearance: 'Level 5 (Executive Admin)',
    location: 'Hyderabad, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2019-01-20',
    manager: 'Elena Rostova (CTO)',
    performanceRating: '5.0 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0104',
    fullName: 'Ananya Patel',
    jobTitle: 'Head of Human Resources & People',
    department: 'HR',
    email: 'ananya.patel@company.com',
    phone: '+91 97234 56789',
    salary: '$145,000',
    annualCompensation: '₹30,00,000',
    securityClearance: 'Level 4 (High Confidential)',
    location: 'Mumbai, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2020-04-12',
    manager: 'Elena Rostova (CTO)',
    performanceRating: '4.85 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0105',
    fullName: 'Alexander Vance',
    jobTitle: 'Director of Cybersecurity & SOC',
    department: 'Security',
    email: 'alex.vance@company.com',
    phone: '+1 (415) 890-1234',
    salary: '$195,000',
    annualCompensation: '$195,000 USD',
    securityClearance: 'Level 5 (SOC Commander)',
    location: 'San Francisco, CA, USA',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2020-08-01',
    manager: 'Elena Rostova (CTO)',
    performanceRating: '4.95 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0106',
    fullName: 'Marcus Sterling',
    jobTitle: 'Chief Financial Officer (CFO)',
    department: 'Finance',
    email: 'marcus.sterling@company.com',
    phone: '+1 (212) 555-0199',
    salary: '$260,000',
    annualCompensation: '$260,000 USD',
    securityClearance: 'Level 5 (Fiscal Vault)',
    location: 'New York, NY, USA',
    status: 'Active',
    employeeType: 'Executive',
    joinedDate: '2018-05-15',
    manager: 'Board of Directors',
    performanceRating: '5.0 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0107',
    fullName: 'Deepak Reddy',
    jobTitle: 'DevSecOps & Zero Trust Engineer',
    department: 'Security',
    email: 'deepak.reddy@company.com',
    phone: '+91 99001 22334',
    salary: '$128,000',
    annualCompensation: '₹26,00,000',
    securityClearance: 'Level 4 (Confidential)',
    location: 'Bangalore, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2023-02-01',
    manager: 'Alexander Vance',
    performanceRating: '4.8 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0108',
    fullName: 'Sophia Laurent',
    jobTitle: 'Senior Compensation & Benefits Manager',
    department: 'HR',
    email: 'sophia.laurent@company.com',
    phone: '+33 1 40 20 50 00',
    salary: '$132,000',
    annualCompensation: '€120,000 EUR',
    securityClearance: 'Level 4 (HR Payroll Admin)',
    location: 'Paris, France',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2021-11-15',
    manager: 'Ananya Patel',
    performanceRating: '4.9 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0109',
    fullName: 'Vikram Malhotra',
    jobTitle: 'Senior Financial Controller',
    department: 'Finance',
    email: 'vikram.malhotra@company.com',
    phone: '+91 98330 99887',
    salary: '$140,000',
    annualCompensation: '₹29,00,000',
    securityClearance: 'Level 4 (Audit Clearance)',
    location: 'Mumbai, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2020-09-01',
    manager: 'Marcus Sterling',
    performanceRating: '4.85 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0110',
    fullName: 'Kavita Nair',
    jobTitle: 'Full-Stack Security Developer',
    department: 'Engineering',
    email: 'kavita.nair@company.com',
    phone: '+91 98860 12345',
    salary: '$120,000',
    annualCompensation: '₹25,00,000',
    securityClearance: 'Level 3 (Protected)',
    location: 'Kochi, India',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2023-07-15',
    manager: 'Sai Kumar',
    performanceRating: '4.75 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0111',
    fullName: 'David Chen',
    jobTitle: 'Cloud Infrastructure & SRE Lead',
    department: 'Operations',
    email: 'david.chen@company.com',
    phone: '+65 6789 0123',
    salary: '$150,000',
    annualCompensation: 'SGD $200,000',
    securityClearance: 'Level 4 (Infrastructure Root)',
    location: 'Singapore',
    status: 'Active',
    employeeType: 'Full-Time',
    joinedDate: '2021-03-01',
    manager: 'Ravi Teja',
    performanceRating: '4.9 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=120&h=120',
  },
  {
    employeeId: 'EMP-2025-0112',
    fullName: 'Zara Al-Mansoor',
    jobTitle: 'Head of Legal & Corporate Compliance',
    department: 'Executive',
    email: 'zara.almansoor@company.com',
    phone: '+971 4 362 7000',
    salary: '$180,000',
    annualCompensation: 'AED 660,000',
    securityClearance: 'Level 5 (Legal Counsel)',
    location: 'Dubai, UAE',
    status: 'Active',
    employeeType: 'Executive',
    joinedDate: '2019-10-10',
    manager: 'Board of Directors',
    performanceRating: '5.0 / 5.0',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120&h=120',
  }
];

/**
 * Generates a clean, professional PDF Document of the HR Employee Records using pdfkit.
 * Returns a Buffer of the generated PDF.
 */
const generateEmployeeDirectoryPdfBuffer = async () => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', err => reject(err));

    // Header Background Accent
    doc.rect(0, 0, doc.page.width, 95).fill('#0f172a');

    // Title & Logo
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('CLOUDSHIELD ENTERPRISE HR VAULT', 40, 25);
    doc.fillColor('#38bdf8').fontSize(11).font('Helvetica').text('CONFIDENTIAL EMPLOYEE DIRECTORY & PAYROLL LEDGER', 40, 50);
    doc.fillColor('#94a3b8').fontSize(8).text(`Generated: ${new Date().toUTCString()} | Zero Trust Classification: HIGH`, 40, 68);

    doc.moveDown(3);

    // Summary Box
    doc.rect(40, 110, doc.page.width - 80, 50).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    doc.text('TOTAL ACTIVE HEADCOUNT: 12', 55, 122);
    doc.text('DEPARTMENTS COVERED: 5 (Engineering, Security, HR, Finance, Executive)', 55, 138);
    doc.text('AVG COMPENSATION: $160,000 USD / yr', 330, 122);
    doc.text('DATA ENCRYPTION: AES-256 Cloudinary Vault', 330, 138);

    let y = 175;

    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('Employee Personnel & Compensation Roster', 40, y);
    y += 20;

    // Table Header
    doc.rect(40, y, doc.page.width - 80, 22).fill('#4f46e5');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('EMP ID', 45, y + 6);
    doc.text('NAME', 110, y + 6);
    doc.text('DEPARTMENT & ROLE', 210, y + 6);
    doc.text('SALARY / COMP', 360, y + 6);
    doc.text('CLEARANCE', 445, y + 6);
    doc.text('LOCATION', 510, y + 6);

    y += 22;

    SYNTHETIC_EMPLOYEES.forEach((emp, index) => {
      const rowBg = index % 2 === 0 ? '#ffffff' : '#f1f5f9';
      doc.rect(40, y, doc.page.width - 80, 28).fill(rowBg);

      doc.fillColor('#4f46e5').fontSize(7.5).font('Helvetica-Bold').text(emp.employeeId, 45, y + 9);
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(emp.fullName, 110, y + 9);
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(`${emp.department} • ${emp.jobTitle}`, 210, y + 9);
      doc.fillColor('#059669').fontSize(7.5).font('Helvetica-Bold').text(emp.salary, 360, y + 9);
      doc.fillColor('#d97706').fontSize(7).font('Helvetica').text(emp.securityClearance.split(' ')[0] + ' ' + emp.securityClearance.split(' ')[1], 445, y + 9);
      doc.fillColor('#334155').fontSize(7).font('Helvetica').text(emp.location.split(',')[0], 510, y + 9);

      y += 28;
    });

    // Footer Security Notice
    y += 15;
    doc.rect(40, y, doc.page.width - 80, 45).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.fillColor('#1e40af').fontSize(8).font('Helvetica-Bold').text('🔒 Zero Trust Access Control Audit Notice', 50, y + 8);
    doc.fillColor('#3b82f6').fontSize(7.5).font('Helvetica').text(
      'This document contains proprietary employee compensation and personnel records. Access is logged in CloudShield immutable audit trails. Unauthorized distribution or export is strictly prohibited.',
      50,
      y + 22,
      { width: doc.page.width - 100 }
    );

    doc.end();
  });
};

/**
 * Uploads the generated Employee Directory PDF to Cloudinary and returns the Cloudinary URL.
 */
const uploadEmployeeDataToCloudinary = async () => {
  if (!isCloudinaryConfigured()) {
    logger.warn('Cloudinary not configured. Returning fallback synthetic PDF data URI.');
    return null;
  }

  try {
    const pdfBuffer = await generateEmployeeDirectoryPdfBuffer();
    logger.info(`Generated Employee Directory PDF (${pdfBuffer.length} bytes). Uploading to Cloudinary...`);

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'cloudshield_hr',
          public_id: 'Enterprise_HR_Employee_Directory_2025.pdf',
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(pdfBuffer);
    });

    logger.info(`Cloudinary Upload Success: ${uploadResult.secure_url}`);
    return {
      secureUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      bytes: uploadResult.bytes,
      format: 'pdf',
      createdAt: uploadResult.created_at,
    };
  } catch (error) {
    logger.error(`Failed to upload Employee Data PDF to Cloudinary: ${error.message}`);
    return null;
  }
};

/**
 * Ensures the "Employee Data" resource in the MongoDB database is configured with
 * Cloudinary PDF storage and returns the updated resource.
 */
const syncEmployeeDataResourceWithCloudinary = async () => {
  try {
    let empResource = await Resource.findOne({ name: 'Employee Data' });
    if (!empResource) {
      empResource = await Resource.findOne({ category: 'HR' });
    }

    if (!empResource) {
      logger.warn('Employee Data resource not found in database.');
      return null;
    }

    const cloudUpload = await uploadEmployeeDataToCloudinary();
    const pdfBuffer = await generateEmployeeDirectoryPdfBuffer();
    const base64Pdf = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    empResource.cloudStorage = {
      isCloudPdf: true,
      provider: 'Cloudinary Cloud',
      bucketName: process.env.CLOUDINARY_CLOUD_NAME ? `${process.env.CLOUDINARY_CLOUD_NAME} / hr-vault` : 'cloudshield-hr-vault',
      fileName: 'Enterprise_HR_Employee_Directory_2025.pdf',
      fileUrl: cloudUpload ? cloudUpload.secureUrl : base64Pdf,
      fileSize: cloudUpload ? `${Math.round(cloudUpload.bytes / 1024)} KB` : `${Math.round(pdfBuffer.length / 1024)} KB`,
      encryption: 'AES-256 Cloudinary Server-Side Encryption',
      fileType: 'application/pdf',
      uploadedAt: new Date(),
    };

    empResource.type = 'Database';
    empResource.description = 'Live HR Employee Directory, Personnel Files, Salary Bands, and Contact Records.';
    await empResource.save();

    logger.info('Synced Employee Data resource with Cloudinary storage successfully.');
    return empResource;
  } catch (err) {
    logger.error(`Error syncing Employee Data resource: ${err.message}`);
    return null;
  }
};

module.exports = {
  SYNTHETIC_EMPLOYEES,
  generateEmployeeDirectoryPdfBuffer,
  uploadEmployeeDataToCloudinary,
  syncEmployeeDataResourceWithCloudinary,
};
