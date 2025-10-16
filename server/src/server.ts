import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { reservationService } from './services/reservationService.js';
import { 
  ReservableObjectType, 
  CreateReservationRequest, 
  AvailabilityCheck 
} from './types/reservations.js';

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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'workspace-reservation-api'
  });
});

// Version endpoint
app.get('/api/version', (req, res) => {
  res.json({ 
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    node_version: process.version
  });
});

// =============================================================================
// RESERVABLE OBJECTS ENDPOINTS (Public)
// =============================================================================

// Get all reservable objects
app.get('/api/objects', (req, res) => {
  try {
    const objects = reservationService.getAllObjects();
    res.json(objects);
  } catch (error) {
    console.error('Error fetching objects:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Get reservable objects by type
app.get('/api/objects/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate object type
    if (!Object.values(ReservableObjectType).includes(type as ReservableObjectType)) {
      return res.status(400).json({ 
        detail: `Invalid object type. Must be one of: ${Object.values(ReservableObjectType).join(', ')}` 
      });
    }

    const objects = reservationService.getObjectsByType(type as ReservableObjectType);
    res.json(objects);
  } catch (error) {
    console.error('Error fetching objects by type:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Get specific reservable object by ID
app.get('/api/objects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const object = reservationService.getObjectById(id);
    
    if (!object) {
      return res.status(404).json({ detail: 'Reservable object not found' });
    }

    res.json(object);
  } catch (error) {
    console.error('Error fetching object:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Check availability for a specific object
app.post('/api/objects/:id/availability', (req, res) => {
  try {
    const { id } = req.params;
    const { startDateTime, endDateTime } = req.body;

    if (!startDateTime || !endDateTime) {
      return res.status(400).json({ 
        detail: 'startDateTime and endDateTime are required' 
      });
    }

    // Validate the object exists
    const object = reservationService.getObjectById(id);
    if (!object) {
      return res.status(404).json({ detail: 'Reservable object not found' });
    }

    const availabilityCheck: AvailabilityCheck = {
      objectId: id,
      startDateTime,
      endDateTime
    };

    const availability = reservationService.checkAvailability(availabilityCheck);
    res.json(availability);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
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

// =============================================================================
// RESERVATIONS ENDPOINTS (Protected)
// =============================================================================

// Get current user's reservations
app.get('/api/reservations', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const reservations = reservationService.getUserReservations(userId);
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Create a new reservation
app.post('/api/reservations', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const reservationRequest: CreateReservationRequest = req.body;

    // Validate required fields
    if (!reservationRequest.objectId || !reservationRequest.startDateTime || !reservationRequest.endDateTime) {
      return res.status(400).json({ 
        detail: 'objectId, startDateTime, and endDateTime are required' 
      });
    }

    // Validate time format
    const timeValidation = reservationService.validateReservationTime(
      reservationRequest.startDateTime, 
      reservationRequest.endDateTime
    );

    if (!timeValidation.valid) {
      return res.status(400).json({ detail: timeValidation.error });
    }

    const result = reservationService.createReservation(userId, reservationRequest);
    
    if (!result.success) {
      return res.status(400).json({ detail: result.error });
    }

    res.status(201).json(result.reservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Get specific reservation by ID
app.get('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    
    const reservation = reservationService.getReservationById(id);
    
    if (!reservation) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }

    // Ensure user can only access their own reservations
    if (reservation.userId !== userId) {
      return res.status(403).json({ detail: 'Access denied' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Cancel a reservation
app.delete('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    
    const result = reservationService.cancelReservation(userId, id);
    
    if (!result.success) {
      return res.status(400).json({ detail: result.error });
    }

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Get upcoming reservations for current user
app.get('/api/reservations/upcoming', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const upcomingReservations = reservationService.getUpcomingReservations(userId);
    res.json(upcomingReservations);
  } catch (error) {
    console.error('Error fetching upcoming reservations:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Get reservations for a specific object (for admins/managers)
app.get('/api/objects/:id/reservations', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    // Check if user has permission (admin or manager)
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ detail: 'Insufficient permissions' });
    }

    const reservations = reservationService.getObjectReservations(id);
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching object reservations:', error);
    res.status(500).json({ detail: 'Internal server error' });
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
  console.log(`🏢 Reservation API endpoints:`);
  console.log(`   GET /api/objects - List all reservable objects`);
  console.log(`   GET /api/objects/type/:type - Objects by type (DESK|PARKING_SPACE)`);
  console.log(`   POST /api/objects/:id/availability - Check availability`);
  console.log(`   POST /api/reservations - Create reservation (protected)`);
  console.log(`   GET /api/reservations - Get user reservations (protected)`);
  console.log(`   DELETE /api/reservations/:id - Cancel reservation (protected)`);
});

export default app;