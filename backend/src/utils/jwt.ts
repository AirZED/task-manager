import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { config } from '../config/config';

interface TokenPayload {
  userId: string;
  email: string;
}

export const generateToken = (userId: Types.ObjectId | string, email: string): string => {
  const payload: TokenPayload = {
    userId: userId.toString(),
    email,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

