import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { 
  CreateReservableObjectRequest, 
  UpdateReservableObjectRequest,
  CreateReservationRequest,
  UpdateReservationRequest,
  AvailabilityQuery
} from './types';
import { objectStore, reservationStore } from './storage';
import { reservationService } from './reservationService';

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

// ===== RESERVABLE OBJECTS API ENDPOINTS =====

// GET /api/objects - List all reservable objects
app.get('/api/objects', authenticateToken, (req, res) => {
  try {
    const objects = objectStore.findAll();
    res.json(objects);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to retrieve objects' });
  }
});

// GET /api/objects/:id - Get specific object
app.get('/api/objects/:id', authenticateToken, (req, res) => {
  try {
    const object = objectStore.findById(req.params.id);
    if (!object) {
      return res.status(404).json({ detail: 'Object not found' });
    }
    res.json(object);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to retrieve object' });
  }
});

// POST /api/objects - Create new object (admin only)
app.post('/api/objects', authenticateToken, (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ detail: 'Admin access required' });
    }

    const data: CreateReservableObjectRequest = req.body;
    const object = objectStore.create(data);
    res.status(201).json(object);
  } catch (error) {
    res.status(400).json({ detail: 'Failed to create object' });
  }
});

// PUT /api/objects/:id - Update object (admin only)
app.put('/api/objects/:id', authenticateToken, (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ detail: 'Admin access required' });
    }

    const data: UpdateReservableObjectRequest = req.body;
    const object = objectStore.update(req.params.id, data);
    if (!object) {
      return res.status(404).json({ detail: 'Object not found' });
    }
    res.json(object);
  } catch (error) {
    res.status(400).json({ detail: 'Failed to update object' });
  }
});

// DELETE /api/objects/:id - Delete object (admin only)
app.delete('/api/objects/:id', authenticateToken, (req, res) => {
  try {
    const userRole = (req as any).user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ detail: 'Admin access required' });
    }

    const success = objectStore.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ detail: 'Object not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ detail: 'Failed to delete object' });
  }
});

// ===== RESERVATIONS API ENDPOINTS =====

// GET /api/reservations - List user's reservations
app.get('/api/reservations', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const includeInactive = req.query.includeInactive === 'true';
    const reservations = reservationService.getUserReservations(userId, includeInactive);
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to retrieve reservations' });
  }
});

// GET /api/reservations/:id - Get specific reservation
app.get('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const reservation = reservationStore.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }

    // Users can only see their own reservations (unless admin)
    if (reservation.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({ detail: 'Access denied' });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to retrieve reservation' });
  }
});

// POST /api/reservations - Create new reservation
app.post('/api/reservations', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const data: CreateReservationRequest = req.body;
    const reservation = reservationService.createReservation(userId, data);
    res.status(201).json(reservation);
  } catch (error: any) {
    res.status(400).json({ detail: error.message || 'Failed to create reservation' });
  }
});

// PUT /api/reservations/:id - Update reservation
app.put('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const data: UpdateReservationRequest = req.body;
    const reservation = reservationService.updateReservation(req.params.id, userId, data);
    res.json(reservation);
  } catch (error: any) {
    const status = error.message?.includes('Not authorized') ? 403 : 
                   error.message?.includes('not found') ? 404 : 400;
    res.status(status).json({ detail: error.message || 'Failed to update reservation' });
  }
});

// DELETE /api/reservations/:id - Cancel reservation
app.delete('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const reservation = reservationService.cancelReservation(req.params.id, userId);
    res.json(reservation);
  } catch (error: any) {
    const status = error.message?.includes('Not authorized') ? 403 : 
                   error.message?.includes('not found') ? 404 : 400;
    res.status(status).json({ detail: error.message || 'Failed to cancel reservation' });
  }
});

// ===== AVAILABILITY API ENDPOINTS =====

// POST /api/availability - Check availability for objects
app.post('/api/availability', authenticateToken, (req, res) => {
  try {
    const query: AvailabilityQuery = req.body;
    const availability = reservationService.getAvailableSlots(query);
    res.json(availability);
  } catch (error: any) {
    res.status(400).json({ detail: error.message || 'Failed to check availability' });
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
});

export default app;