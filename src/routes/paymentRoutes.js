import express from 'express';
import {
  recordPayment,
  getMyPayments,
  getPaymentInvoice
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(recordPayment)
  .get(getMyPayments);

router.get('/:id/invoice', getPaymentInvoice);

export default router;
