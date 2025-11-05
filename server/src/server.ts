import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import {
  ReservableObject,
  ParkingSpace,
  Desk,
  Reservation,
  CreateReservationRequest,
  CreateObjectRequest,
  UpdateReservationRequest,
  ObjectFilters,
  AvailabilityQuery,
  ConflictCheckRequest,
  ObjectAnalytics
} from './types';
import {
  dataStore,
  generateId,
  hasTimeConflict,
  getAvailableObjects
} from './data';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Role-based access control middleware
const requireRole = (roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ detail: 'Authentication required' });
    }
    
    if (!roles.includes(user.role)) {
      return res.status(403).json({ detail: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'workspace-reservation-api'
  });
});

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

// ========================================
// OBJECTS MANAGEMENT ENDPOINTS
// ========================================

// GET /api/objects - List all objects with filters
app.get('/api/objects', (req, res) => {
  try {
    const filters = req.query as ObjectFilters;
    let allObjects: (ParkingSpace | Desk)[] = [...dataStore.parkingSpaces, ...dataStore.desks];
    
    // Apply filters
    if (filters.type) {
      allObjects = allObjects.filter(obj => obj.type === filters.type);
    }
    
    if (filters.location) {
      allObjects = allObjects.filter(obj =>
        obj.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    
    if (filters.isActive !== undefined) {
      allObjects = allObjects.filter(obj => obj.isActive === filters.isActive);
    }
    
    if (filters.level !== undefined) {
      allObjects = allObjects.filter(obj =>
        obj.type === 'parking' && (obj as ParkingSpace).level === filters.level
      );
    }
    
    if (filters.workspaceType) {
      allObjects = allObjects.filter(obj =>
        obj.type === 'desk' && (obj as Desk).workspaceType === filters.workspaceType
      );
    }
    
    if (filters.hasEVCharging !== undefined) {
      allObjects = allObjects.filter(obj =>
        obj.type === 'parking' && (obj as ParkingSpace).isEVCharging === filters.hasEVCharging
      );
    }
    
    if (filters.hasWindow !== undefined) {
      allObjects = allObjects.filter(obj =>
        obj.type === 'desk' && (obj as Desk).hasWindow === filters.hasWindow
      );
    }
    
    res.json(allObjects);
  } catch (error) {
    res.status(500).json({ detail: 'Error fetching objects' });
  }
});

// GET /api/objects/:id - Get specific object
app.get('/api/objects/:id', (req, res) => {
  try {
    const objectId = req.params.id;
    const object = dataStore.parkingSpaces.find(p => p.id === objectId) ||
                   dataStore.desks.find(d => d.id === objectId);
    
    if (!object) {
      return res.status(404).json({ detail: 'Object not found' });
    }
    
    res.json(object);
  } catch (error) {
    res.status(500).json({ detail: 'Error fetching object' });
  }
});

// POST /api/objects - Create new object (Admin only)
app.post('/api/objects', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const objectData: CreateObjectRequest = req.body;
    
    if (!objectData.name || !objectData.type || !objectData.location || !objectData.capacity) {
      return res.status(400).json({ detail: 'Missing required fields: name, type, location, capacity' });
    }
    
    const now = new Date().toISOString();
    const newObject: ReservableObject = {
      id: generateId(objectData.type === 'parking' ? 'park' : 'desk'),
      name: objectData.name,
      type: objectData.type,
      location: objectData.location,
      capacity: objectData.capacity,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    
    // Add type-specific properties
    if (objectData.type === 'parking') {
      const parkingSpace: ParkingSpace = {
        ...newObject,
        type: 'parking',
        level: objectData.level || 0,
        spotNumber: objectData.spotNumber || '',
        isCovered: objectData.isCovered || false,
        isEVCharging: objectData.isEVCharging || false,
        isAccessible: objectData.isAccessible || false
      };
      dataStore.parkingSpaces.push(parkingSpace);
      res.status(201).json(parkingSpace);
    } else {
      const desk: Desk = {
        ...newObject,
        type: 'desk',
        workspaceType: objectData.workspaceType || 'hotdesk',
        equipment: objectData.equipment || [],
        maxOccupants: objectData.maxOccupants || objectData.capacity,
        hasWindow: objectData.hasWindow || false
      };
      dataStore.desks.push(desk);
      res.status(201).json(desk);
    }
  } catch (error) {
    res.status(500).json({ detail: 'Error creating object' });
  }
});

// PUT /api/objects/:id - Update object (Admin/Manager only)
app.put('/api/objects/:id', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
  try {
    const objectId = req.params.id;
    const updates = req.body;
    
    // Find object in either parking spaces or desks
    let objectIndex = dataStore.parkingSpaces.findIndex(p => p.id === objectId);
    let isParkingSpace = true;
    
    if (objectIndex === -1) {
      objectIndex = dataStore.desks.findIndex(d => d.id === objectId);
      isParkingSpace = false;
    }
    
    if (objectIndex === -1) {
      return res.status(404).json({ detail: 'Object not found' });
    }
    
    const objects = isParkingSpace ? dataStore.parkingSpaces : dataStore.desks;
    const updatedObject = {
      ...objects[objectIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    objects[objectIndex] = updatedObject;
    res.json(updatedObject);
  } catch (error) {
    res.status(500).json({ detail: 'Error updating object' });
  }
});

// DELETE /api/objects/:id - Delete object (Admin only)
app.delete('/api/objects/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const objectId = req.params.id;
    
    // Remove from parking spaces
    let parkingIndex = dataStore.parkingSpaces.findIndex(p => p.id === objectId);
    if (parkingIndex !== -1) {
      dataStore.parkingSpaces.splice(parkingIndex, 1);
      return res.json({ message: 'Object deleted successfully' });
    }
    
    // Remove from desks
    let deskIndex = dataStore.desks.findIndex(d => d.id === objectId);
    if (deskIndex !== -1) {
      dataStore.desks.splice(deskIndex, 1);
      return res.json({ message: 'Object deleted successfully' });
    }
    
    res.status(404).json({ detail: 'Object not found' });
  } catch (error) {
    res.status(500).json({ detail: 'Error deleting object' });
  }
});

// ========================================
// RESERVATIONS MANAGEMENT ENDPOINTS
// ========================================

// GET /api/reservations - Get user's reservations
app.get('/api/reservations', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const userReservations = dataStore.reservations.filter(res => res.userId === userId);
    res.json(userReservations);
  } catch (error) {
    res.status(500).json({ detail: 'Error fetching reservations' });
  }
});

// GET /api/reservations/available - Get available objects for date/time
app.get('/api/reservations/available', (req, res) => {
  try {
    const { date, startTime, endTime, type } = req.query as unknown as AvailabilityQuery;
    
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ detail: 'Missing required query parameters: date, startTime, endTime' });
    }
    
    const availableObjects = type
      ? getAvailableObjects(type, date, startTime, endTime)
      : [
          ...getAvailableObjects('parking', date, startTime, endTime),
          ...getAvailableObjects('desk', date, startTime, endTime)
        ];
    
    res.json(availableObjects);
  } catch (error) {
    res.status(500).json({ detail: 'Error fetching available objects' });
  }
});

// POST /api/reservations - Create new reservation
app.post('/api/reservations', authenticateToken, (req, res) => {
  try {
    const reservationData: CreateReservationRequest = req.body;
    const user = (req as any).user;
    
    // Validate required fields
    if (!reservationData.objectId || !reservationData.objectType || !reservationData.startTime || !reservationData.endTime || !reservationData.date) {
      return res.status(400).json({ detail: 'Missing required fields: objectId, objectType, startTime, endTime, date' });
    }
    
    // Check if object exists and is active
    const object = reservationData.objectType === 'parking'
      ? dataStore.parkingSpaces.find(p => p.id === reservationData.objectId)
      : dataStore.desks.find(d => d.id === reservationData.objectId);
    
    if (!object || !object.isActive) {
      return res.status(404).json({ detail: 'Object not found or inactive' });
    }
    
    // Check for conflicts
    const targetStart = new Date(`${reservationData.date}T${reservationData.startTime}`);
    const targetEnd = new Date(`${reservationData.date}T${reservationData.endTime}`);
    
    const objectReservations = dataStore.reservations.filter(
      res => res.objectId === reservationData.objectId &&
             res.date === reservationData.date &&
             res.status === 'active'
    );
    
    if (hasTimeConflict(targetStart, targetEnd, objectReservations)) {
      return res.status(409).json({ detail: 'Time conflict detected - object already reserved for this time slot' });
    }
    
    // Create new reservation
    const newReservation: Reservation = {
      id: generateId('res'),
      objectId: reservationData.objectId,
      objectType: reservationData.objectType,
      userId: user.userId,
      userEmail: user.email,
      startTime: `${reservationData.date}T${reservationData.startTime}`,
      endTime: `${reservationData.date}T${reservationData.endTime}`,
      date: reservationData.date,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    dataStore.reservations.push(newReservation);
    res.status(201).json(newReservation);
  } catch (error) {
    res.status(500).json({ detail: 'Error creating reservation' });
  }
});

// PUT /api/reservations/:id - Update reservation
app.put('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const reservationId = req.params.id;
    const updates: UpdateReservationRequest = req.body;
    const user = (req as any).user;
    
    const reservationIndex = dataStore.reservations.findIndex(r => r.id === reservationId);
    
    if (reservationIndex === -1) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }
    
    const reservation = dataStore.reservations[reservationIndex];
    
    // Check if user owns this reservation or is admin/manager
    if (reservation.userId !== user.userId && !['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ detail: 'Insufficient permissions' });
    }
    
    // If updating time, check for conflicts
    if (updates.startTime || updates.endTime) {
      const newStartTime = updates.startTime ? `${reservation.date}T${updates.startTime}` : reservation.startTime;
      const newEndTime = updates.endTime ? `${reservation.date}T${updates.endTime}` : reservation.endTime;
      const targetStart = new Date(newStartTime);
      const targetEnd = new Date(newEndTime);
      
      const objectReservations = dataStore.reservations.filter(
        res => res.objectId === reservation.objectId &&
               res.date === reservation.date &&
               res.status === 'active' &&
               res.id !== reservationId
      );
      
      if (hasTimeConflict(targetStart, targetEnd, objectReservations)) {
        return res.status(409).json({ detail: 'Time conflict detected' });
      }
    }
    
    // Update reservation
    const updatedReservation = {
      ...reservation,
      ...updates,
      startTime: updates.startTime ? `${reservation.date}T${updates.startTime}` : reservation.startTime,
      endTime: updates.endTime ? `${reservation.date}T${updates.endTime}` : reservation.endTime,
      updatedAt: new Date().toISOString()
    };
    
    dataStore.reservations[reservationIndex] = updatedReservation;
    res.json(updatedReservation);
  } catch (error) {
    res.status(500).json({ detail: 'Error updating reservation' });
  }
});

// DELETE /api/reservations/:id - Cancel reservation
app.delete('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const reservationId = req.params.id;
    const user = (req as any).user;
    
    const reservationIndex = dataStore.reservations.findIndex(r => r.id === reservationId);
    
    if (reservationIndex === -1) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }
    
    const reservation = dataStore.reservations[reservationIndex];
    
    // Check if user owns this reservation or is admin/manager
    if (reservation.userId !== user.userId && !['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ detail: 'Insufficient permissions' });
    }
    
    // Mark as cancelled instead of deleting
    dataStore.reservations[reservationIndex] = {
      ...reservation,
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    };
    
    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Error cancelling reservation' });
  }
});

// GET /api/reservations/conflicts - Check for booking conflicts
app.get('/api/reservations/conflicts', authenticateToken, (req, res) => {
  try {
    const { objectId, startTime, endTime, date, excludeReservationId } = req.query as unknown as ConflictCheckRequest;
    
    if (!objectId || !startTime || !endTime || !date) {
      return res.status(400).json({ detail: 'Missing required query parameters' });
    }
    
    const targetStart = new Date(`${date}T${startTime}`);
    const targetEnd = new Date(`${date}T${endTime}`);
    
    const objectReservations = dataStore.reservations.filter(
      res => res.objectId === objectId &&
             res.date === date &&
             res.status === 'active' &&
             res.id !== excludeReservationId
    );
    
    const hasConflict = hasTimeConflict(targetStart, targetEnd, objectReservations);
    
    res.json({ hasConflict, conflictingReservations: objectReservations });
  } catch (error) {
    res.status(500).json({ detail: 'Error checking conflicts' });
  }
});

// ========================================
// ADMIN/MANAGER ENDPOINTS
// ========================================

// GET /api/admin/reservations - All reservations (Admin/Manager)
app.get('/api/admin/reservations', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
  try {
    const { userId, status, date } = req.query;
    let reservations = [...dataStore.reservations];
    
    if (userId) {
      reservations = reservations.filter(r => r.userId === userId);
    }
    
    if (status) {
      reservations = reservations.filter(r => r.status === status);
    }
    
    if (date) {
      reservations = reservations.filter(r => r.date === date);
    }
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ detail: 'Error fetching admin reservations' });
  }
});

// GET /api/admin/objects/analytics - Usage statistics
app.get('/api/admin/objects/analytics', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
  try {
    const totalObjects = dataStore.parkingSpaces.length + dataStore.desks.length;
    const activeObjects = dataStore.parkingSpaces.filter(p => p.isActive).length +
                         dataStore.desks.filter(d => d.isActive).length;
    
    // Calculate utilization rate (simplified - active reservations vs total capacity)
    const activeReservations = dataStore.reservations.filter(r => r.status === 'active').length;
    const utilizationRate = totalObjects > 0 ? (activeReservations / (totalObjects * 24)) * 100 : 0;
    
    // Popular time slots (simplified)
    const timeSlotCounts: { [key: string]: number } = {};
    dataStore.reservations.forEach(reservation => {
      const hour = new Date(reservation.startTime).getHours();
      const timeSlot = `${hour}:00-${hour + 1}:00`;
      timeSlotCounts[timeSlot] = (timeSlotCounts[timeSlot] || 0) + 1;
    });
    
    const popularTimeSlots = Object.entries(timeSlotCounts)
      .map(([timeRange, bookingCount]) => ({ timeRange, bookingCount }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);
    
    const analytics: ObjectAnalytics = {
      totalObjects,
      activeObjects,
      parkingSpaces: dataStore.parkingSpaces.length,
      desks: dataStore.desks.length,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      popularTimeSlots
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ detail: 'Error fetching analytics' });
  }
});

// PUT /api/admin/reservations/:id/status - Update reservation status
app.put('/api/admin/reservations/:id/status', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
  try {
    const reservationId = req.params.id;
    const { status } = req.body;
    
    if (!['active', 'cancelled', 'expired'].includes(status)) {
      return res.status(400).json({ detail: 'Invalid status. Must be active, cancelled, or expired' });
    }
    
    const reservationIndex = dataStore.reservations.findIndex(r => r.id === reservationId);
    
    if (reservationIndex === -1) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }
    
    dataStore.reservations[reservationIndex] = {
      ...dataStore.reservations[reservationIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    
    res.json(dataStore.reservations[reservationIndex]);
  } catch (error) {
    res.status(500).json({ detail: 'Error updating reservation status' });
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