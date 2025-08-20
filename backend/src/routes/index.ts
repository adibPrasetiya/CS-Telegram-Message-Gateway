import { Router } from 'express';
import authRoutes from './auth';
import chatRoutes from './chat';
import historyRoutes from './history';
import clientRoutes from './clients';
import broadcastRoutes from './broadcast';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/history', historyRoutes);
router.use('/clients', clientRoutes);
router.use('/broadcast', broadcastRoutes);

export default router;