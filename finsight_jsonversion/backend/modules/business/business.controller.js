import * as businessService from './business.service.js';
import { HTTP_STATUS } from '../../config/constants.js';

// Invoices
export async function getInvoices(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const list = await businessService.getInvoices(wsId);
    return res.status(HTTP_STATUS.OK).json(list);
  } catch (err) {
    next(err);
  }
}

// Khata
export async function getKhata(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const list = await businessService.getKhataLedgers(wsId);
    return res.status(HTTP_STATUS.OK).json(list);
  } catch (err) {
    next(err);
  }
}

export async function createKhata(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const entry = await businessService.createKhataEntry(wsId, req.body);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Khata entry added successfully!',
      entry
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteKhata(req, res, next) {
  try {
    const { id } = req.params;
    const wsId = req.headers['x-workspace-id'] || 'personal';
    await businessService.deleteKhataEntry(id, wsId);
    return res.status(HTTP_STATUS.OK).json({ success: true, message: 'Khata entry removed.' });
  } catch (err) {
    next(err);
  }
}

// Inventory
export async function getInventory(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const list = await businessService.getInventory(wsId);
    return res.status(HTTP_STATUS.OK).json(list);
  } catch (err) {
    next(err);
  }
}

export async function createInventory(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const item = await businessService.createInventoryItem(wsId, req.body);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Inventory item added successfully!',
      item
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteInventory(req, res, next) {
  try {
    const { id } = req.params;
    const wsId = req.headers['x-workspace-id'] || 'personal';
    await businessService.deleteInventoryItem(id, wsId);
    return res.status(HTTP_STATUS.OK).json({ success: true, message: 'Item deleted.' });
  } catch (err) {
    next(err);
  }
}

// Subscriptions
export async function getSubscriptions(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const list = await businessService.getSubscriptions(wsId);
    return res.status(HTTP_STATUS.OK).json(list);
  } catch (err) {
    next(err);
  }
}

export async function createSubscription(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const sub = await businessService.createSubscription(wsId, req.body);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Subscription tracked successfully!',
      subscription: sub
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const wsId = req.headers['x-workspace-id'] || 'personal';
    await businessService.deleteSubscription(id, wsId);
    return res.status(HTTP_STATUS.OK).json({ success: true, message: 'Subscription removed.' });
  } catch (err) {
    next(err);
  }
}

// SME Engines Handlers
export async function getCashflowRadar(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const result = await businessService.calculateCashFlowRadar(wsId);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPagarKhata(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const result = await businessService.calculatePagarKhata(wsId);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDeadStock(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const result = await businessService.analyzeDeadStockAndReorder(wsId);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getGstr2bItc(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const result = await businessService.reconcileGstr2bItc(wsId);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getShutterDown(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const result = await businessService.generateDailyShutterDownSummary({ workspaceId: wsId });
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPriceHikes(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const result = await businessService.analyzeSupplierPriceHikes({ workspaceId: wsId });
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getTdsWatchdog(req, res, next) {
  try {
    const wsId = req.headers['x-workspace-id'] || 'personal';
    const result = await businessService.calculateTdsTcsWatchdog({ workspaceId: wsId });
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function postSmartRecovery(req, res, next) {
  try {
    const result = await businessService.generateSmartRecoverySequence(req.body);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function postChequeBounce(req, res, next) {
  try {
    const result = businessService.generateChequeBounceNotice(req.body);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function postEWayBill(req, res, next) {
  try {
    const result = businessService.generateEWayBillPayload(req.body);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}
