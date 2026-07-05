import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { sendOTP, verifyOTP } from '../services/sms.service';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.body;

    // Check if user exists
    const existingUser = await db.oneOrNone('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required for verification' });
    }

    // Send OTP to the phone number
    const sent = await sendOTP(phone);
    if (!sent) {
      return res.status(500).json({ error: 'Failed to send OTP SMS' });
    }

    res.status(200).json({ message: 'OTP sent successfully, please verify' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyRegistration = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and OTP code are required' });
    }

    // Verify OTP
    const isValid = await verifyOTP(phone, code);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    // Check if user exists again
    const existingUser = await db.oneOrNone('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const user = await db.one(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role',
      [name, email, passwordHash, phone, role || 'commuter']
    );

    // Create token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Verify registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
