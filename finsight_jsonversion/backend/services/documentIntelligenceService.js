import { GoogleGenAI } from '@google/genai';
import csv from 'csv-parser';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import Transaction from '../models/Transaction.js';
import MerchantMapping from '../models/MerchantMapping.js';
import { parsePdfBufferWithNativeRegex } from './pdfParsers.js';

// Comprehensive Vernacular Indian Numerals Mapping (Hindi, Marathi, Tamil, Telugu, Kannada, Malayalam, Gujarati, Bengali, Devanagari)
const INDIAN_VERNACULAR_DIGITS = {
  // Devanagari (Hindi / Marathi)
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  // Tamil
  '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4', '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
  // Telugu
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
  // Kannada
  '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4', '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
  // Malayalam
  '൦': '0', '൧': '1', '൨': '2', '൩': '3', '൪': '4', '൫': '5', '൬': '6', '൭': '7', '൮': '8', '൯': '9',
  // Gujarati
  '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
  // Bengali / Assamese
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export function normalizeDevanagariNumerals(inputStr = '') {
  if (!inputStr) return '';
  return String(inputStr).replace(/[०-९௦-௯౦-౯೦-೯൦-൯૦-૯০-৯]/g, (w) => INDIAN_VERNACULAR_DIGITS[w] || w);
}

export function parseIndianAmount(val, fallback = 0) {
  if (typeof val === 'number') return isNaN(val) ? fallback : Math.abs(val);
  if (!val) return fallback;
  const normalizedStr = normalizeDevanagariNumerals(String(val));
  const str = normalizedStr.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : Math.abs(parsed);
}

export function normalizeDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const cleaned = normalizeDevanagariNumerals(String(dateStr)).trim();
  
  // Matches DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const indianFormat = cleaned.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (indianFormat) {
    let [, day, month, year] = indianFormat;
    if (year.length === 2) year = '20' + year;
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Matches YYYY-MM-DD
  const isoFormat = cleaned.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
  if (isoFormat) {
    let [, year, month, day] = isoFormat;
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const d = new Date(cleaned);
  return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
}

export function detectCsvColumnMapping(headers = []) {
  const mapping = {
    date: null,
    description: null,
    debit: null,
    credit: null,
    amount: null,
    type: null,
    balance: null,
    refNo: null
  };

  headers.forEach(h => {
    const lower = h.toLowerCase().trim();
    if (!mapping.date && (lower.includes('date') || lower.includes('dt') || lower.includes('time') || lower.includes('दिनांक') || lower.includes('तारीख') || lower.includes('தேதி'))) {
      mapping.date = h;
    } else if (!mapping.description && (lower.includes('particular') || lower.includes('narration') || lower.includes('desc') || lower.includes('remark') || lower.includes('detail') || lower.includes('merchant') || lower.includes('विवरण') || lower.includes('तपशील') || lower.includes('விவரம்'))) {
      mapping.description = h;
    } else if (!mapping.debit && (lower.includes('withdraw') || lower.includes('debit') || lower.includes('dr') || lower.includes('out') || lower.includes('expense') || lower.includes('खर्च') || lower.includes('नावे') || lower.includes('செலவு'))) {
      mapping.debit = h;
    } else if (!mapping.credit && (lower.includes('deposit') || lower.includes('credit') || lower.includes('cr') || lower.includes('in') || lower.includes('income') || lower.includes('जमा') || lower.includes('आय') || lower.includes('வருமானம்'))) {
      mapping.credit = h;
    } else if (!mapping.amount && (lower.includes('amount') || lower.includes('amt') || lower.includes('val') || lower.includes('राशि') || lower.includes('रक्कम'))) {
      mapping.amount = h;
    } else if (!mapping.type && (lower.includes('type') || lower.includes('kind') || lower.includes('प्रकार'))) {
      mapping.type = h;
    } else if (!mapping.balance && (lower.includes('bal') || lower.includes('closing') || lower.includes('शेष') || lower.includes('बाकी'))) {
      mapping.balance = h;
    } else if (!mapping.refNo && (lower.includes('ref') || lower.includes('utr') || lower.includes('chq') || lower.includes('id') || lower.includes('trans'))) {
      mapping.refNo = h;
    }
  });

  return mapping;
}

// XLSX / XLS Spreadsheet Buffer Processing
export async function processXLSXBuffer(fileBuffer, workspaceId) {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Excel workbook contains no sheets.');

    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    if (rawRows.length === 0) throw new Error('Excel sheet contains no data rows.');

    const headers = Object.keys(rawRows[0]);
    const mapping = detectCsvColumnMapping(headers);

    const extracted = [];
    let idCounter = 1;

    for (const row of rawRows) {
      const rawDate = mapping.date ? row[mapping.date] : '';
      const description = mapping.description ? row[mapping.description] : 'Excel Transaction';
      const debitVal = mapping.debit ? parseIndianAmount(row[mapping.debit]) : 0;
      const creditVal = mapping.credit ? parseIndianAmount(row[mapping.credit]) : 0;
      const amtVal = mapping.amount ? parseIndianAmount(row[mapping.amount]) : 0;
      const balance = mapping.balance ? parseIndianAmount(row[mapping.balance]) : null;
      const refNo = mapping.refNo ? String(row[mapping.refNo]).trim() : '';

      let type = 'expense';
      let finalAmount = 0;

      if (creditVal > 0) {
        type = 'income';
        finalAmount = creditVal;
      } else if (debitVal > 0) {
        type = 'expense';
        finalAmount = debitVal;
      } else if (amtVal > 0) {
        finalAmount = amtVal;
        if (mapping.type && String(row[mapping.type]).toLowerCase().includes('cr')) {
          type = 'income';
        }
      }

      if (finalAmount <= 0) continue;

      const date = normalizeDate(rawDate);
      const tempId = `xlsx-txn-${Date.now()}-${idCounter++}`;

      extracted.push({
        tempId,
        date,
        description: String(description || 'Transaction').trim(),
        merchantName: String(description || 'Merchant').split(' ')[0],
        category: 'Other',
        type,
        amount: finalAmount,
        debit: debitVal || (type === 'expense' ? finalAmount : 0),
        credit: creditVal || (type === 'income' ? finalAmount : 0),
        balance: balance || undefined,
        referenceNumber: refNo || undefined,
        confidenceScore: 0.98,
        needsReview: false,
        isDuplicate: false,
        approved: true
      });
    }

    return await applyLearnedMerchantMappings(workspaceId, extracted);
  } catch (err) {
    throw new Error('Failed to process Excel spreadsheet: ' + err.message);
  }
}

export async function processCSVBuffer(fileBuffer, workspaceId) {
  const rawRows = [];
  const bufferStream = new Readable();
  bufferStream.push(fileBuffer);
  bufferStream.push(null);

  return new Promise((resolve, reject) => {
    bufferStream
      .pipe(csv())
      .on('data', (row) => { if (rawRows.length < 5000) rawRows.push(row); })
      .on('end', async () => {
        if (rawRows.length === 0) return reject(new Error('CSV file contains no rows.'));

        const headers = Object.keys(rawRows[0]);
        const mapping = detectCsvColumnMapping(headers);

        const extracted = [];
        let idCounter = 1;

        for (const row of rawRows) {
          const rawDate = mapping.date ? row[mapping.date] : '';
          const description = mapping.description ? row[mapping.description] : 'CSV Transaction';
          const debitVal = mapping.debit ? parseIndianAmount(row[mapping.debit]) : 0;
          const creditVal = mapping.credit ? parseIndianAmount(row[mapping.credit]) : 0;
          const amtVal = mapping.amount ? parseIndianAmount(row[mapping.amount]) : 0;
          const balance = mapping.balance ? parseIndianAmount(row[mapping.balance]) : null;
          const refNo = mapping.refNo ? row[mapping.refNo] : '';

          let type = 'expense';
          let finalAmount = 0;

          if (creditVal > 0) {
            type = 'income';
            finalAmount = creditVal;
          } else if (debitVal > 0) {
            type = 'expense';
            finalAmount = debitVal;
          } else if (amtVal > 0) {
            finalAmount = amtVal;
            if (mapping.type && String(row[mapping.type]).toLowerCase().includes('cr')) {
              type = 'income';
            }
          }

          if (finalAmount <= 0) continue;

          const date = normalizeDate(rawDate);
          const tempId = `csv-txn-${Date.now()}-${idCounter++}`;

          extracted.push({
            tempId,
            date,
            description: String(description || 'Transaction').trim(),
            merchantName: String(description || 'Merchant').split(' ')[0],
            category: 'Other',
            type,
            amount: finalAmount,
            debit: debitVal || (type === 'expense' ? finalAmount : 0),
            credit: creditVal || (type === 'income' ? finalAmount : 0),
            balance: balance || undefined,
            referenceNumber: refNo || undefined,
            confidenceScore: 0.98,
            needsReview: false,
            isDuplicate: false,
            approved: true
          });
        }

        const mapped = await applyLearnedMerchantMappings(workspaceId, extracted);
        resolve(mapped);
      })
      .on('error', (err) => reject(err));
  });
}

/**
 * Local Generic Receipt & Document Heuristic Extractor
 * Extracts amounts, dates, and keywords from unstructured text buffers offline
 */
export function parseGenericReceiptLocally(text = '', originalName = '') {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const extracted = [];
  let detectedAmount = 0;
  let detectedDate = normalizeDate(new Date());

  // Search for Total / Grand Total / Net Payable amounts
  for (const line of lines) {
    const totalMatch = line.match(/(?:total|grand\s*total|net\s*payable|amount\s*paid|bill\s*amount|balance\s*due)\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{2})?)/i);
    if (totalMatch) {
      detectedAmount = parseIndianAmount(totalMatch[1]);
      break;
    }
  }

  // Fallback: Find largest currency figure in document
  if (detectedAmount === 0) {
    const allAmounts = text.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/gi) || [];
    const parsedNums = allAmounts.map(a => parseIndianAmount(a)).filter(n => n > 0);
    if (parsedNums.length > 0) {
      detectedAmount = Math.max(...parsedNums);
    }
  }

  // Search for date patterns
  const dateMatch = text.match(/(?:\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})|(?:\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/);
  if (dateMatch) {
    detectedDate = normalizeDate(dateMatch[0]);
  }

  if (detectedAmount > 0) {
    const cleanDesc = originalName ? originalName.replace(/\.[^/.]+$/, '').replace(/[_-\s]+/g, ' ') : 'Scanned Receipt / Bill';
    extracted.push({
      tempId: `local-rcpt-${Date.now()}-1`,
      date: detectedDate,
      description: cleanDesc,
      merchantName: cleanDesc.split(' ')[0] || 'Vendor',
      category: 'Other',
      type: 'expense',
      amount: detectedAmount,
      debit: detectedAmount,
      credit: 0,
      confidenceScore: 0.90,
      needsReview: false,
      isDuplicate: false,
      approved: true
    });
  }

  return extracted;
}

/**
 * High-Speed Multi-Source Document Ingestion (Native Local Code First -> Graceful Gemini Vision OCR Fallback)
 */
export async function processPDFOrImageWithAI(fileBuffer, mimeType, originalName, workspaceId = null) {
  let extractedText = '';
  const isPdf = mimeType === 'application/pdf' || (originalName && originalName.toLowerCase().endsWith('.pdf'));

  if (isPdf) {
    try {
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const pdf = require('pdf-parse');
      const uint8Data = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer);
      if (pdf && pdf.PDFParse) {
        const parser = new pdf.PDFParse(uint8Data);
        const textResult = await parser.getText();
        extractedText = typeof textResult === 'string' ? textResult : (textResult?.text || '');
      } else if (typeof pdf === 'function') {
        const parsedData = await pdf(uint8Data);
        extractedText = parsedData.text || '';
      }
    } catch (e) {
      console.warn('[PDF Text Extraction Warning]:', e.message);
    }
  }

  // ─── TIER 1: INSTANT SUB-50ms NATIVE LOCAL PARSER ───
  if (isPdf) {
    try {
      const regexResult = await parsePdfBufferWithNativeRegex(fileBuffer);
      if (regexResult && regexResult.transactions && regexResult.transactions.length > 0) {
        console.log(`[Document Ingestion] ✅ Local Native Parser matched (${regexResult.parser}): Extracted ${regexResult.transactions.length} transactions`);
        const mapped = await applyLearnedMerchantMappings(workspaceId, regexResult.transactions);
        return {
          documentType: 'bank_statement',
          parserUsed: regexResult.parser,
          extracted: mapped
        };
      }
    } catch (regexErr) {
      console.warn('[Document Ingestion] Local native regex attempt skipped:', regexErr.message);
    }
  }

  // ─── TIER 2: GEMINI 2.5 FLASH MULTIMODAL & TEXT STATEMENT PARSER ───
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an expert Document Intelligence Assistant specializing in Indian financial statements, mandi receipts, UPI slips, bills, and invoices.
Analyze this document (${originalName || 'financial_doc'}).

Extract all transaction records, receipt details, and financial entries.
Multilingual prompt engineering:
- Support Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, and English text.
- Convert Devanagari numerals (०, १, २, ३, ४, ५, ६, ७, ८, ९) to standard decimal numbers.
- Translate terms: 'भाडे' -> Rent, 'किराणा' -> Food/Groceries, 'पगार' -> Payroll.
- Standardize dates to YYYY-MM-DD format.
- Accurately determine type ('income' vs 'expense').

Return strictly a JSON object:
{
  "documentType": "bank_statement",
  "openingBalance": 0,
  "closingBalance": 0,
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Narration or merchant",
      "merchantName": "Merchant Name",
      "category": "Rent|Payroll|Utilities|Food|Travel|Office|Marketing|Software|Groceries|Other",
      "type": "expense",
      "amount": 1250.00,
      "debit": 1250.00,
      "credit": 0.00,
      "referenceNumber": "UPI/UTR/Ref No",
      "confidenceScore": 0.98
    }
  ]
}
Only return valid raw JSON without markdown.`;

      let contentsPayload;
      if (extractedText && extractedText.trim().length >= 30) {
        // High-speed text prompt (<2s)
        contentsPayload = `Document content to parse:\n\n${extractedText.slice(0, 60000)}\n\n${prompt}`;
      } else {
        // Scanned image / photo / vector PDF fallback
        const base64Data = fileBuffer.toString('base64');
        const inlineData = { data: base64Data, mimeType: mimeType || 'application/pdf' };
        contentsPayload = [{ inlineData }, prompt];
      }

      const geminiTask = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contentsPayload,
        config: { responseMimeType: 'application/json' }
      });

      const timeoutTask = new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini Vision OCR timeout')), 25000));
      const response = await Promise.race([geminiTask, timeoutTask]);

      let jsonText = response.text || '{}';
      jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();

      const parsed = JSON.parse(jsonText);
      const documentType = parsed.documentType || 'bank_statement';
      const rawTxns = Array.isArray(parsed.transactions) ? parsed.transactions : [];

      let idCounter = 1;
      const extracted = rawTxns
        .filter(t => parseIndianAmount(t.amount || t.debit || t.credit) > 0)
        .map(t => {
          const amt = parseIndianAmount(t.amount || t.debit || t.credit);
          const conf = typeof t.confidenceScore === 'number' ? t.confidenceScore : 0.96;
          return {
            tempId: `ai-txn-${Date.now()}-${idCounter++}`,
            date: normalizeDate(t.date),
            description: String(t.description || t.merchantName || 'Extracted Transaction').trim(),
            merchantName: String(t.merchantName || t.description || 'Merchant').trim(),
            category: t.category || 'Other',
            type: t.type === 'income' ? 'income' : 'expense',
            amount: amt,
            debit: parseIndianAmount(t.debit || (t.type === 'expense' ? amt : 0)),
            credit: parseIndianAmount(t.credit || (t.type === 'income' ? amt : 0)),
            balance: t.balance ? parseIndianAmount(t.balance) : undefined,
            referenceNumber: t.referenceNumber ? String(t.referenceNumber).trim() : undefined,
            confidenceScore: conf,
            needsReview: false,
            isDuplicate: false,
            approved: true
          };
        });

      if (extracted.length > 0) {
        console.log(`[Document Ingestion] ✅ Gemini Intelligence succeeded: Extracted ${extracted.length} transactions`);
        const finalExtracted = await applyLearnedMerchantMappings(workspaceId, extracted);
        return { documentType, parserUsed: 'gemini_intelligence', extracted: finalExtracted };
      }
    } catch (geminiErr) {
      console.warn('[Document Ingestion] Gemini Vision OCR timed out or failed, utilizing local heuristic fallback:', geminiErr.message);
    }
  }

  // ─── TIER 3: LOCAL TEXT HEURISTIC PARSER FALLBACK ───
  const textForHeuristics = extractedText || fileBuffer.toString('utf-8');
  const localExtracted = parseGenericReceiptLocally(textForHeuristics, originalName);
  const finalExtracted = await applyLearnedMerchantMappings(workspaceId, localExtracted);

  return {
    documentType: 'receipt',
    parserUsed: 'local_heuristic_engine',
    extracted: finalExtracted
  };
}

/**
 * 5. Self-Learning Merchant Memory (merchant_mappings)
 * Applies saved category overrides for recognized merchants in the workspace
 */
export async function applyLearnedMerchantMappings(workspaceId, extractedList = []) {
  if (!workspaceId || extractedList.length === 0) return extractedList;

  try {
    const mappings = await MerchantMapping.find({ workspaceId }).lean();
    if (!mappings || mappings.length === 0) return extractedList;

    const map = new Map();
    mappings.forEach(m => {
      map.set(m.merchantPattern.toLowerCase().trim(), m.assignedCategory);
    });

    return extractedList.map(t => {
      const merchKey = (t.merchantName || '').toLowerCase().trim();
      const descKey = (t.description || '').toLowerCase().trim();

      let assignedCat = map.get(merchKey) || map.get(descKey);
      if (!assignedCat) {
        for (const [pattern, cat] of map.entries()) {
          if (descKey.includes(pattern) || merchKey.includes(pattern)) {
            assignedCat = cat;
            break;
          }
        }
      }

      if (assignedCat) {
        return {
          ...t,
          category: assignedCat,
          learnedApplied: true
        };
      }
      return t;
    });
  } catch (err) {
    console.warn('[Merchant Mapping Warning]:', err.message);
    return extractedList;
  }
}

export async function detectDuplicatesInWorkspace(workspaceId, extractedList = []) {
  if (!workspaceId || extractedList.length === 0) return extractedList;

  try {
    const existingTxns = await Transaction.find({
      $or: [{ businessId: workspaceId }, { userId: workspaceId }, { workspaceId }]
    }).lean();

    const existingMap = new Set();
    existingTxns.forEach(t => {
      const key = `${t.date}_${t.amount}_${(t.description || '').toLowerCase().trim().slice(0, 15)}`;
      existingMap.add(key);
    });

    return extractedList.map(t => {
      const key = `${t.date}_${t.amount}_${(t.description || '').toLowerCase().trim().slice(0, 15)}`;
      const isDuplicate = existingMap.has(key);
      return {
        ...t,
        isDuplicate,
        needsReview: isDuplicate ? true : t.needsReview
      };
    });
  } catch (e) {
    console.warn('[Duplicate Detector Warning]:', e.message);
    return extractedList;
  }
}
