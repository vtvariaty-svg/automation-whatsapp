import { Router } from 'express';
import { getTenantConfig, updateTenantConfig } from '../services/tenantService';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/config', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const config = await getTenantConfig(tenantId);
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/config', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const updated = await updateTenantConfig(tenantId, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
