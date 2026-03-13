import { Router } from 'express';
import { createProduct, listProducts, getProduct, updateProduct, deleteProduct } from '../services/tenantService';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, description, price, category, currency, stock } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const product = await createProduct(tenantId, { 
      name, 
      description, 
      price: Number(price),
      category,
      currency: currency || 'BRL',
      stock: stock ? Number(stock) : null
    });
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const products = await listProducts(tenantId);
    res.json(products);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const product = await getProduct(tenantId, req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, description, price, category, currency, stock } = req.body;
    
    const product = await updateProduct(tenantId, req.params.id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(category !== undefined && { category }),
      ...(currency !== undefined && { currency }),
      ...(stock !== undefined && { stock: stock === null ? null : Number(stock) })
    });
    
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    await deleteProduct(tenantId, req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
