import { Router } from 'express';
import { register, login, verifyRegistration } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/verify-registration', verifyRegistration);
router.post('/login', login);

export default router;
