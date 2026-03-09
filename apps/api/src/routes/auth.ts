import { Router } from 'express';
import { registerUser, loginUser } from '../services/authService';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const data = await registerUser(name, email, password);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const data = await loginUser(email, password);
    res.json(data);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

export default router;
