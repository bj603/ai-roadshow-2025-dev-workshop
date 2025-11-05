import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { storage } from './data/storage.js';
import { reservationService } from './services/reservationService.js';
import { ApiResponse, CreateReservationRequest } from './types/index.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Mock users (same as your Supabase function)
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@example.com",
    password: "admin123",
    name: "Admin User",
    role: "admin"
  },
  {
    id: "2",
    email: "manager@example.com",
    password: "manager123",
    name: "Manager User",
    role: "manager"
  },
  {
    id: "3",
    email: "user@example.com",
    password: "user123",
    name: "Regular User",
    role: "user"
  }
];

// Types
interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Auth endpoint
app.post('/api/auth', (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    const user = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return res.status(401).json({ 
        detail: "Invalid email or password" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(400).json({ detail: "Invalid request" });
  }
});

// Health check endpoint
// that returns service status and timestamp
// to help monitor the API health

// Version endpoint
app.get('/api/version', (req, res) => {
  res.json({ 
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    node_version: process.version
  });
});

// Middleware to verify JWT tokens (for protected routes)
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ detail: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ detail: 'Invalid or expired token' });
    }
    (req as any).user = user;
    next();
  });
};

// Protected route example
app.get('/api/profile', authenticateToken, (req, res) => {
  const userId = (req as any).user.userId;
  const user = MOCK_USERS.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
});

// ========== RESERVATION SYSTEM API ENDPOINTS ==========

// Get all reservable objects
app.get('/api/objects', (req, res) => {
  try {
    const { type } = req.query;
    let objects = storage.getAllObjects();
    
    if (type && (type === 'desk' || type === 'parking')) {
      objects = storage.getObjectsByType(type);
    }

    const response: ApiResponse = {
      success: true,
      data: objects,
      message: `Found ${objects.length} objects`
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve objects'
    });
  }
});

// Check availability for a specific object
app.get('/api/objects/:id/availability', (req, res) => {
  try {
    const { id } = req.params;
    const { startDateTime, endDateTime } = req.query;

    if (!startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        error: 'startDateTime and endDateTime query parameters are required'
      });
    }

    const availability = reservationService.checkAvailability(
      id,
      startDateTime as string,
      endDateTime as string
    );

    const response: ApiResponse = {
      success: true,
      data: availability
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check availability'
    });
  }
});

// Get available objects for a time period
app.get('/api/objects/available', (req, res) => {
  try {
    const { startDateTime, endDateTime, type } = req.query;

    if (!startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        error: 'startDateTime and endDateTime query parameters are required'
      });
    }

    const availableObjects = reservationService.getAvailableObjects(
      startDateTime as string,
      endDateTime as string,
      type as 'desk' | 'parking' | undefined
    );

    const response: ApiResponse = {
      success: true,
      data: availableObjects,
      message: `Found ${availableObjects.length} available objects`
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get available objects'
    });
  }
});

// Create a new reservation (protected)
app.post('/api/reservations', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { objectId, startDateTime, endDateTime }: CreateReservationRequest = req.body;

    const reservationRequest: CreateReservationRequest = {
      objectId,
      userId,
      startDateTime,
      endDateTime
    };

    const result = reservationService.createReservation(reservationRequest);

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        data: result.reservation,
        message: 'Reservation created successfully'
      };
      res.status(201).json(response);
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create reservation'
    });
  }
});

// Get user's reservations (protected)
app.get('/api/reservations', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { status } = req.query;

    let reservations;
    if (status === 'active') {
      reservations = reservationService.getActiveReservationsForUser(userId);
    } else if (status === 'upcoming') {
      reservations = reservationService.getUpcomingReservationsForUser(userId);
    } else {
      reservations = reservationService.getReservationsForUser(userId);
    }

    const response: ApiResponse = {
      success: true,
      data: reservations,
      message: `Found ${reservations.length} reservations`
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reservations'
    });
  }
});

// Get reservations for a specific object
app.get('/api/objects/:id/reservations', (req, res) => {
  try {
    const { id } = req.params;
    const reservations = reservationService.getReservationsForObject(id);

    const response: ApiResponse = {
      success: true,
      data: reservations,
      message: `Found ${reservations.length} reservations for object ${id}`
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve object reservations'
    });
  }
});

// Cancel a reservation (protected)
app.delete('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const result = reservationService.cancelReservation(id, userId);

    if (result.success) {
      const response: ApiResponse = {
        success: true,
        data: result.reservation,
        message: 'Reservation cancelled successfully'
      };
      res.json(response);
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel reservation'
    });
  }
});

// Admin endpoint: Get storage statistics
app.get('/api/admin/stats', authenticateToken, (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = storage.getStats();
    
    // Complete expired reservations and get count
    const completedCount = reservationService.completeExpiredReservations();
    
    const response: ApiResponse = {
      success: true,
      data: {
        ...stats,
        completedExpiredReservations: completedCount
      },
      message: 'Storage statistics retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Demo credentials:`);
  console.log(`   Admin: admin@example.com / admin123`);
  console.log(`   Manager: manager@example.com / manager123`);
  console.log(`   User: user@example.com / user123`);
  console.log(`🏢 Reservation System Endpoints:`);
  console.log(`   GET /api/objects - List all reservable objects`);
  console.log(`   GET /api/objects/:id/availability - Check availability`);
  console.log(`   POST /api/reservations - Create reservation (auth required)`);
  console.log(`   GET /api/reservations - Get user reservations (auth required)`);
  console.log(`   DELETE /api/reservations/:id - Cancel reservation (auth required)`);
});

export default app;