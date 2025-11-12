import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

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

// Reservation system types
interface Resource {
  id: string;
  type: 'desk' | 'parking';
  name: string;
  location: string;
  isActive: boolean;
}

interface Reservation {
  id: string;
  resourceId: string;
  userId: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string;   // ISO 8601 format
  status: 'active' | 'cancelled';
  createdAt: string;
}

// In-memory storage
const resourceStorage = new Map<string, Resource>();
const reservationStorage = new Map<string, Reservation>();

// Sample data initialization
const initializeSampleData = () => {
  // Sample resources
  const sampleResources: Resource[] = [
    {
      id: 'desk-1',
      type: 'desk',
      name: 'Desk 1',
      location: 'Floor 1, Zone A',
      isActive: true
    },
    {
      id: 'desk-2',
      type: 'desk',
      name: 'Desk 2',
      location: 'Floor 1, Zone A',
      isActive: true
    },
    {
      id: 'desk-3',
      type: 'desk',
      name: 'Desk 3',
      location: 'Floor 1, Zone B',
      isActive: true
    },
    {
      id: 'parking-1',
      type: 'parking',
      name: 'Parking Spot 1',
      location: 'Underground Level 1',
      isActive: true
    },
    {
      id: 'parking-2',
      type: 'parking',
      name: 'Parking Spot 2',
      location: 'Underground Level 1',
      isActive: true
    }
  ];

  sampleResources.forEach(resource => {
    resourceStorage.set(resource.id, resource);
  });

  // Sample reservations (some existing ones for demo)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  
  const sampleReservations: Reservation[] = [
    {
      id: 'res-1',
      resourceId: 'desk-1',
      userId: '1',
      startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
      endDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0).toISOString(),
      status: 'active',
      createdAt: now.toISOString()
    },
    {
      id: 'res-2',
      resourceId: 'parking-1',
      userId: '2',
      startDateTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 8, 0).toISOString(),
      endDateTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 18, 0).toISOString(),
      status: 'active',
      createdAt: now.toISOString()
    }
  ];

  sampleReservations.forEach(reservation => {
    reservationStorage.set(reservation.id, reservation);
  });
};

// Initialize sample data
initializeSampleData();

// Utility functions for data management
const generateId = () => {
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
};

const getAllResources = (): Resource[] => {
  return Array.from(resourceStorage.values()).filter(r => r.isActive);
};

const getResourceById = (id: string): Resource | undefined => {
  return resourceStorage.get(id);
};

const getAllReservations = (): Reservation[] => {
  return Array.from(reservationStorage.values()).filter(r => r.status === 'active');
};

const getReservationsByUserId = (userId: string): Reservation[] => {
  return Array.from(reservationStorage.values())
    .filter(r => r.userId === userId && r.status === 'active');
};

const getReservationById = (id: string): Reservation | undefined => {
  return reservationStorage.get(id);
};

const createReservation = (reservation: Omit<Reservation, 'id' | 'createdAt'>): Reservation => {
  const newReservation: Reservation = {
    ...reservation,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  reservationStorage.set(newReservation.id, newReservation);
  return newReservation;
};

const updateReservation = (id: string, updates: Partial<Reservation>): Reservation | null => {
  const existing = reservationStorage.get(id);
  if (!existing) return null;
  
  const updated = { ...existing, ...updates };
  reservationStorage.set(id, updated);
  return updated;
};

const deleteReservation = (id: string): boolean => {
  const existing = reservationStorage.get(id);
  if (!existing) return false;
  
  // Soft delete by setting status to cancelled
  existing.status = 'cancelled';
  reservationStorage.set(id, existing);
  return true;
};

// Validation functions
const checkReservationOverlap = (
  resourceId: string, 
  startDateTime: string, 
  endDateTime: string, 
  excludeReservationId?: string
): Reservation[] => {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  
  return getAllReservations()
    .filter(r => 
      r.resourceId === resourceId && 
      r.id !== excludeReservationId && // Exclude current reservation when updating
      r.status === 'active'
    )
    .filter(r => {
      const rStart = new Date(r.startDateTime);
      const rEnd = new Date(r.endDateTime);
      
      // Check for overlap: new start < existing end AND new end > existing start
      return start < rEnd && end > rStart;
    });
};

const validateReservationRequest = (
  resourceId: string,
  startDateTime: string,
  endDateTime: string,
  excludeReservationId?: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check if resource exists and is active
  const resource = getResourceById(resourceId);
  if (!resource) {
    errors.push('Resource not found');
  } else if (!resource.isActive) {
    errors.push('Resource is not available');
  }
  
  // Validate date formats
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  
  if (isNaN(start.getTime())) {
    errors.push('Invalid start date format');
  }
  
  if (isNaN(end.getTime())) {
    errors.push('Invalid end date format');
  }
  
  if (errors.length === 0) {
    // Validate date logic
    if (start >= end) {
      errors.push('End time must be after start time');
    }
    
    if (start < new Date()) {
      errors.push('Start time cannot be in the past');
    }
    
    // Check for overlapping reservations
    const overlappingReservations = checkReservationOverlap(
      resourceId, 
      startDateTime, 
      endDateTime, 
      excludeReservationId
    );
    
    if (overlappingReservations.length > 0) {
      errors.push(`Resource is already reserved during this time period. Conflicting reservations: ${overlappingReservations.map(r => r.id).join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

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

// Resources endpoints
app.get('/api/resources', authenticateToken, (req, res) => {
  try {
    const resources = getAllResources();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch resources' });
  }
});

app.get('/api/resources/:id', authenticateToken, (req, res) => {
  try {
    const resource = getResourceById(req.params.id);
    if (!resource) {
      return res.status(404).json({ detail: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch resource' });
  }
});

// Reservations endpoints
app.get('/api/reservations', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    let reservations;
    if (userRole === 'admin' || userRole === 'manager') {
      // Admins and managers can see all reservations
      reservations = getAllReservations();
    } else {
      // Regular users can only see their own reservations
      reservations = getReservationsByUserId(userId);
    }
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch reservations' });
  }
});

app.get('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const reservation = getReservationById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }
    
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    // Check if user can access this reservation
    if (userRole !== 'admin' && userRole !== 'manager' && reservation.userId !== userId) {
      return res.status(403).json({ detail: 'Access denied' });
    }
    
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch reservation' });
  }
});

app.post('/api/reservations', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { resourceId, startDateTime, endDateTime } = req.body;
    
    // Basic validation
    if (!resourceId || !startDateTime || !endDateTime) {
      return res.status(400).json({ 
        detail: 'Missing required fields: resourceId, startDateTime, endDateTime' 
      });
    }
    
    // Comprehensive validation
    const validation = validateReservationRequest(resourceId, startDateTime, endDateTime);
    if (!validation.valid) {
      return res.status(400).json({ 
        detail: 'Validation failed',
        errors: validation.errors 
      });
    }
    
    // Create reservation
    const newReservation = createReservation({
      resourceId,
      userId,
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString(),
      status: 'active'
    });
    
    res.status(201).json(newReservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ detail: 'Failed to create reservation' });
  }
});

app.put('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const reservationId = req.params.id;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { startDateTime, endDateTime } = req.body;
    
    const existing = getReservationById(reservationId);
    if (!existing) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }
    
    // Check permissions
    if (userRole !== 'admin' && userRole !== 'manager' && existing.userId !== userId) {
      return res.status(403).json({ detail: 'Access denied' });
    }
    
    // Prepare the updated times for validation
    const finalStart = startDateTime || existing.startDateTime;
    const finalEnd = endDateTime || existing.endDateTime;
    
    // Validate the updated reservation
    const validation = validateReservationRequest(
      existing.resourceId, 
      finalStart, 
      finalEnd,
      reservationId // Exclude current reservation from overlap check
    );
    
    if (!validation.valid) {
      return res.status(400).json({ 
        detail: 'Validation failed',
        errors: validation.errors 
      });
    }
    
    // Build updates object
    let updates: Partial<Reservation> = {};
    if (startDateTime) {
      updates.startDateTime = new Date(startDateTime).toISOString();
    }
    if (endDateTime) {
      updates.endDateTime = new Date(endDateTime).toISOString();
    }
    
    const updatedReservation = updateReservation(reservationId, updates);
    if (!updatedReservation) {
      return res.status(500).json({ detail: 'Failed to update reservation' });
    }
    
    res.json(updatedReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ detail: 'Failed to update reservation' });
  }
});

app.delete('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const reservationId = req.params.id;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    
    const existing = getReservationById(reservationId);
    if (!existing) {
      return res.status(404).json({ detail: 'Reservation not found' });
    }
    
    // Check permissions
    if (userRole !== 'admin' && userRole !== 'manager' && existing.userId !== userId) {
      return res.status(403).json({ detail: 'Access denied' });
    }
    
    const success = deleteReservation(reservationId);
    if (!success) {
      return res.status(500).json({ detail: 'Failed to cancel reservation' });
    }
    
    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to cancel reservation' });
  }
});

// Check resource availability
app.get('/api/reservations/availability/:resourceId', authenticateToken, (req, res) => {
  try {
    const resourceId = req.params.resourceId;
    const { date } = req.query; // Optional date parameter (YYYY-MM-DD)
    
    // Get resource
    const resource = getResourceById(resourceId);
    if (!resource || !resource.isActive) {
      return res.status(404).json({ detail: 'Resource not found' });
    }
    
    // Get all active reservations for this resource
    let reservations = getAllReservations()
      .filter(r => r.resourceId === resourceId);
    
    // If date is provided, filter reservations for that day
    if (date) {
      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ detail: 'Invalid date format. Use YYYY-MM-DD' });
      }
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      reservations = reservations.filter(r => {
        const rStart = new Date(r.startDateTime);
        const rEnd = new Date(r.endDateTime);
        // Include reservations that overlap with the target date
        return rStart <= endOfDay && rEnd >= startOfDay;
      });
    }
    
    const reservationDetails = reservations.map(r => ({
      id: r.id,
      startDateTime: r.startDateTime,
      endDateTime: r.endDateTime,
      userId: r.userId
    }));
    
    res.json({
      resource,
      date: date || 'all',
      reservations: reservationDetails,
      reservationCount: reservationDetails.length,
      hasReservations: reservationDetails.length > 0
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ detail: 'Failed to check availability' });
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