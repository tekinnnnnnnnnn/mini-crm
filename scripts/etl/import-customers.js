#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { Customer, sequelize } = require('../../src/models');
const { normalizeEmail, normalizePhoneTR, isValidEmail, isNonEmptyString } = require('../../src/lib/validation');

function usageAndExit(code = 1) {
  console.error(
    [
      'Usage:',
      '  node scripts/etl/import-customers.js <file.csv> [--dry-run] [--mode skip|upsert] [--report <file.json>]',
      '',
      'Notes:',
      '  - Excel dosyasını CSV olarak dışa aktarın (UTF-8 önerilir).',
      '  - Duplicate kontrolü: önce phone, sonra email.',
      '  - --mode skip: duplicate ise ekleme (default)',
      '  - --mode upsert: duplicate ise mevcut kaydı güncelle (PII overwrite konusunda dikkat)'
    ].join('\n')
  );
  process.exit(code);
}

function parseArgs(argv) {
  const args = { file: null, dryRun: false, mode: 'skip', report: null };
  const rest = argv.slice(2);
  if (!rest.length) usageAndExit(1);

  args.file = rest[0];
  for (let i = 1; i < rest.length; i++) {
    const token = rest[i];
    if (token === '--dry-run') args.dryRun = true;
    else if (token === '--mode') args.mode = rest[++i] || '';
    else if (token === '--report') args.report = rest[++i] || '';
    else usageAndExit(1);
  }

  if (!['skip', 'upsert'].includes(args.mode)) usageAndExit(1);
  return args;
}

function stripQuotes(value) {
  if (!isNonEmptyString(value)) return value;
  return value.replace(/^["“”']+|["“”']+$/g, '').trim();
}

function normalizeName(value) {
  if (!isNonEmptyString(value)) return null;
  return stripQuotes(value).replace(/\s+/g, ' ').trim();
}

function splitFullName(fullName) {
  const normalized = normalizeName(fullName);
  if (!normalized) return { firstName: null, lastName: null };
  const parts = normalized.split(' ').filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function inferFirstName({ email, phone }) {
  if (isNonEmptyString(email)) {
    const local = email.split('@')[0] || '';
    const cleaned = local.replace(/[._\-]+/g, ' ').trim();
    if (cleaned) return cleaned.split(' ')[0];
  }
  if (isNonEmptyString(phone)) return 'Müşteri';
  return 'Müşteri';
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      continue;
    }

    if (ch === '\r') continue;
    field += ch;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function toHeaderMap(headerRow) {
  const map = new Map();
  for (let i = 0; i < headerRow.length; i++) {
    const raw = String(headerRow[i] ?? '').trim().toLowerCase();
    if (!raw) continue;
    map.set(raw, i);
  }
  return map;
}

function getCell(row, headerMap, keys) {
  for (const key of keys) {
    const idx = headerMap.get(key);
    if (idx === undefined) continue;
    return row[idx];
  }
  return undefined;
}

function buildCustomerFromRow(row, headerMap) {
  const fullName = getCell(row, headerMap, ['ad soyad', 'adsoyad', 'isim', 'name']);
  const firstNameRaw = getCell(row, headerMap, ['ad', 'isim', 'firstname', 'first_name']);
  const lastNameRaw = getCell(row, headerMap, ['soyad', 'lastname', 'last_name']);

  let firstName = normalizeName(firstNameRaw);
  let lastName = normalizeName(lastNameRaw);
  if (!firstName && !lastName) {
    const split = splitFullName(fullName);
    firstName = split.firstName;
    lastName = split.lastName;
  }

  const phoneRaw = getCell(row, headerMap, ['telefon', 'phone', 'tel']);
  const emailRaw = getCell(row, headerMap, ['email', 'e-posta', 'eposta']);
  const addressRaw = getCell(row, headerMap, ['adres', 'address']);
  const noteRaw = getCell(row, headerMap, ['not', 'note']);

  const phone = normalizePhoneTR(phoneRaw);
  const email = normalizeEmail(emailRaw);

  return {
    firstName,
    lastName,
    phone,
    email,
    address: normalizeName(addressRaw),
    note: normalizeName(noteRaw)
  };
}

async function findDuplicate({ phone, email }) {
  if (phone) {
    const found = await Customer.findOne({ where: { phone } });
    if (found) return { found, by: 'phone' };
  }
  if (email) {
    const found = await Customer.findOne({ where: { email } });
    if (found) return { found, by: 'email' };
  }
  return null;
}

function heuristicKey({ firstName, lastName, address }) {
  const a = (firstName || '').toLowerCase();
  const b = (lastName || '').toLowerCase();
  const c = (address || '').toLowerCase();
  return `${a}|${b}|${c}`.replace(/\s+/g, ' ').trim();
}

async function main() {
  const args = parseArgs(process.argv);
  const inputPath = path.resolve(args.file);
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const report = {
    file: inputPath,
    mode: args.mode,
    dryRun: args.dryRun,
    startedAt: new Date().toISOString(),
    totals: {
      rows: 0,
      created: 0,
      updated: 0,
      skippedDuplicate: 0,
      invalid: 0,
      warnings: 0
    },
    invalidRows: [],
    duplicates: [],
    warnings: []
  };

  await sequelize.authenticate();

  const csvText = fs.readFileSync(inputPath, 'utf8');
  const rows = parseCsv(csvText);
  if (!rows.length) {
    console.error('Empty CSV');
    process.exit(1);
  }

  const headerMap = toHeaderMap(rows[0]);
  const dataRows = rows.slice(1).filter(r => r.some(cell => String(cell ?? '').trim() !== ''));
  report.totals.rows = dataRows.length;
  const seenHeuristic = new Map();

  const hasNameHeader = ['ad', 'soyad', 'ad soyad', 'adsoyad', 'isim', 'name'].some(k => headerMap.has(k));
  if (!hasNameHeader) {
    report.warnings.push({
      type: 'missing_column',
      message: 'Name columns not found (expected: Ad/Soyad or Ad Soyad).'
    });
    report.totals.warnings++;
  }

  const hasPhoneHeader = ['telefon', 'phone', 'tel'].some(k => headerMap.has(k));
  if (!hasPhoneHeader) {
    report.warnings.push({
      type: 'missing_column',
      message: 'Phone column not found (expected: Telefon/Phone/Tel).'
    });
    report.totals.warnings++;
  }

  for (let index = 0; index < dataRows.length; index++) {
    const rowNumber = index + 2; // 1-based + header row
    const row = dataRows[index];
    const customerData = buildCustomerFromRow(row, headerMap);

    const issues = [];
    const warnings = [];
    if (!isNonEmptyString(customerData.firstName)) {
      customerData.firstName = inferFirstName(customerData);
      warnings.push('firstName_inferred');
    }
    if (customerData.email && !isValidEmail(customerData.email)) {
      warnings.push('email_invalid_dropped');
      customerData.email = null;
    }
    if (customerData.phone && customerData.phone.length < 10) {
      warnings.push('phone_too_short_dropped');
      customerData.phone = null;
    }

    if (warnings.length) {
      report.warnings.push({ rowNumber, warnings, incoming: customerData });
      report.totals.warnings++;
    }

    if (!customerData.phone && !customerData.email) {
      const key = heuristicKey(customerData);
      const prev = seenHeuristic.get(key);
      if (prev) {
        report.duplicates.push({
          rowNumber,
          by: 'heuristic',
          existingRowNumber: prev,
          incoming: customerData
        });
        report.totals.skippedDuplicate++;
        continue;
      }
      seenHeuristic.set(key, rowNumber);
    }

    const dup = await findDuplicate(customerData);
    if (dup) {
      report.duplicates.push({
        rowNumber,
        by: dup.by,
        existingCustomerId: dup.found.id,
        incoming: customerData
      });

      if (args.mode === 'skip') {
        report.totals.skippedDuplicate++;
        continue;
      }

      if (!args.dryRun) {
        await dup.found.update({
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          phone: customerData.phone ?? dup.found.phone,
          email: customerData.email ?? dup.found.email,
          address: customerData.address ?? dup.found.address
        });
      }
      report.totals.updated++;
      continue;
    }

    if (!args.dryRun) {
      await Customer.create({
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address
      });
    }
    report.totals.created++;
  }

  report.finishedAt = new Date().toISOString();

  const outputJson = JSON.stringify(report, null, 2);
  if (args.report) {
    fs.writeFileSync(path.resolve(args.report), outputJson, 'utf8');
    console.log(`Report written: ${args.report}`);
  } else {
    console.log(outputJson);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
