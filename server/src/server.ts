import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { 
  reservableObjectStorage, 
  reservationStorage 
} from './storage';
import {
  ReservableObjectType,
  CreateReservableObjectRequest,
  UpdateReservableObjectRequest,
  CreateReservationRequest,
  UpdateReservationRequest
} from './models';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Initialize sample data
function initializeSampleData() {
  // Create sample desks
  reservableObjectStorage.create({
    type: ReservableObjectType.DESK,
    name: 'Desk A1',
    location: 'Floor 1, Zone A',
    description: 'Quiet workspace with monitor'
  });
  
  reservableObjectStorage.create({
    type: ReservableObjectType.DESK,
    name: 'Desk A2',
    location: 'Floor 1, Zone A',
    description: 'Standing desk with dual monitors'
  });
  
  reservableObjectStorage.create({
    type: ReservableObjectType.DESK,
    name: 'Desk B1',
    location: 'Floor 1, Zone B',
    description: 'Collaborative workspace'
  });
  
  // Create sample parking spaces
  reservableObjectStorage.create({
    type: ReservableObjectType.PARKING_SPACE,
    name: 'Parking Space P1',
    location: 'Level 1, Section A',
    description: 'Standard parking space'
  });
  
  reservableObjectStorage.create({
    type: ReservableObjectType.PARKING_SPACE,
    name: 'Parking Space P2',
    location: 'Level 1, Section A',
    description: 'Electric vehicle charging available'
  });
  
  console.log('✅ Sample data initialized');
}

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

// ===============================================
// RESERVABLE OBJECTS API ENDPOINTS
// ===============================================

// Get all reservable objects
app.get('/api/reservable-objects', authenticateToken, (req, res) => {
  try {
    const { type } = req.query;
    const objectType = type ? type as ReservableObjectType : undefined;
    const objects = reservableObjectStorage.getActive(objectType);
    res.json(objects);
  } catch (error) {
    res.status(400).json({ detail: 'Invalid request' });
  }
});

// Get a specific reservable object
app.get('/api/reservable-objects/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const object = reservableObjectStorage.getById(id);
    
    if (!object || !object.isActive) {
      return res.status(404).json({ detail: 'Reservable object not found' });
    }
    
    res.json(object);
  } catch (error) {
    res.status(400).json({ detail: 'Invalid request' });
  }
});

// Create a new reservable object (admin/manager only)
app.post('/api/reservable-objects', authenticateToken, (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ detail: 'Insufficient permissions' });
    }

    const createRequest: CreateReservableObjectRequest = req.body;
    const object = reservableObjectStorage.create(createRequest);
    res.status(201).json(object);
  } catch (error) {
    res.status(400).json({ detail: 'Invalid request' });
  }
});

// Update a reservable object (admin/manager only)
app.put('/api/reservable-objects/:id', authenticateToken, (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ detail: 'Insufficient permissions' });
    }

    const { id } = req.params;
    const updateRequest: UpdateReservableObjectRequest = req.body;
    const updatedObject = reservableObjectStorage.update(id, updateRequest);
    
    if (!updatedObject) {
      return res.status(404).json({ detail: 'Reservable object not found' });
    }
    
    res.json(updatedObject);
  } catch (error) {
    res.status(400).json({ detail: 'Invalid request' });
  }
});

// Delete a reservable object (admin only)
app.delete('/api/reservable-objects/:id', authenticateToken, (req, res) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({ detail: 'Admin access required' });
    }

    const { id } = req.params;
    const deleted = reservableObjectStorage.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ detail: 'Reservable object not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ detail: 'Invalid request' });
  }
});

// Search reservable objects
app.get('/api/reservable-objects/search/:query', authenticateToken, (req, res) => {
  try {
    const { query } = req.params;
    const objects = reservableObjectStorage.search(query);
    res.json(objects);
  } catch (error) {
    res.status(400).json({ detail: 'Invalid request' });
  }
});

// ===============================================
// RESERVATIONS API ENDPOINTS
// ===============================================

// Get all reservations for the authenticated user
app.get('/api/reservations', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    let reservations;
    
    // Admins and managers can see all reservations, users only see their own
    if (userRole === 'admin' || userRole === 'manager') {
      const { userId: queryUserId, objectId } = req.query;
      
      if (queryUserId) {
        reservations = reservationStorage.getByUserId(queryUserId as string);
      } else if (objectId) {
        reservations = reservationStorage.getByObjectId(objectId as string);
      } else {
        reservations = reservationStorage.getAll().filter(r => r.isActive);
      }
    } else {
      reservations = reservationStorage.getByUserId(userId);
    }
    
    res.json(reservations);
  } catch (error) {
    res.status(400).json({ detail: 'Invalid request' });
  }
});

// Get a specific reservation
app.get('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    const reservation = reservationStorage.getById(id);
    
    if (!reservation || !reservation.isActive) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }
    
    // Users can only access their own reservations, admins/managers can access all
    if (userRole !== 'admin' && userRole !== 'manager' && reservation.userId !== userId) {
      return res.status(403).json({ detail: 'Access denied' });
    }
    
    res.json(reservation);
  } catch (error) {
    res.status(400).json({ detail: 'Invalid request' });
  }
});

// Create a new reservation
app.post('/api/reservations', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const createRequest: CreateReservationRequest = {
      ...req.body,
      userId // Always use the authenticated user's ID
    };
    
    // Verify the reservable object exists
    const object = reservableObjectStorage.getById(createRequest.objectId);
    if (!object || !object.isActive) {
      return res.status(404).json({ detail: 'Reservable object not found' });
    }
    
    const reservation = reservationStorage.create(createRequest);
    res.status(201).json(reservation);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ detail: error.message });
    } else {
      res.status(400).json({ detail: 'Invalid request' });
    }
  }
});

// Update a reservation
app.put('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    const existingReservation = reservationStorage.getById(id);
    
    if (!existingReservation || !existingReservation.isActive) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }
    
    // Users can only update their own reservations, admins/managers can update all
    if (userRole !== 'admin' && userRole !== 'manager' && existingReservation.userId !== userId) {
      return res.status(403).json({ detail: 'Access denied' });
    }
    
    const updateRequest: UpdateReservationRequest = req.body;
    const updatedReservation = reservationStorage.update(id, updateRequest);
    
    if (!updatedReservation) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }
    
    res.json(updatedReservation);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ detail: error.message });
    } else {
      res.status(400).json({ detail: 'Invalid request' });
    }
  }
});

// Cancel a reservation
app.delete('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    const existingReservation = reservationStorage.getById(id);
    
    if (!existingReservation || !existingReservation.isActive) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }
    
    // Users can only cancel their own reservations, admins/managers can cancel all
    if (userRole !== 'admin' && userRole !== 'manager' && existingReservation.userId !== userId) {
      return res.status(403).json({ detail: 'Access denied' });
    }
    
    const deleted = reservationStorage.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ detail: 'Invalid request' });
  }
});

// Check availability for a reservable object
app.post('/api/reservable-objects/:id/availability', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { startDateTime, endDateTime, duration } = req.body;
    
    // Verify the reservable object exists
    const object = reservableObjectStorage.getById(id);
    if (!object || !object.isActive) {
      return res.status(404).json({ detail: 'Reservable object not found' });
    }
    
    const start = new Date(startDateTime);
    let end: Date;
    
    if (endDateTime) {
      end = new Date(endDateTime);
    } else if (duration) {
      end = new Date(start.getTime() + duration * 60 * 1000);
    } else {
      return res.status(400).json({ detail: 'Either endDateTime or duration must be provided' });
    }
    
    if (start >= end) {
      return res.status(400).json({ detail: 'End time must be after start time' });
    }
    
    const availability = reservationStorage.checkAvailability(id, { start, end });
    res.json(availability);
  } catch (error) {
    res.status(400).json({ detail: 'Invalid request' });
  }
});

// Get reservations for a date range
app.get('/api/reservations/date-range', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate, objectId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ detail: 'startDate and endDate are required' });
    }
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (start >= end) {
      return res.status(400).json({ detail: 'End date must be after start date' });
    }
    
    const reservations = reservationStorage.getByDateRange(
      start, 
      end, 
      objectId as string | undefined
    );
    
    res.json(reservations);
  } catch (error) {
    res.status(400).json({ detail: 'Invalid request' });
  }
});

// Initialize sample data
initializeSampleData();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Demo credentials:`);
  console.log(`   Admin: admin@example.com / admin123`);
  console.log(`   Manager: manager@example.com / manager123`);
  console.log(`   User: user@example.com / user123`);
  console.log(`🏢 API endpoints available:`);
  console.log(`   GET /api/reservable-objects - List all objects`);
  console.log(`   POST /api/reservations - Create reservation`);
  console.log(`   GET /api/reservations - List user reservations`);
});

export default app;