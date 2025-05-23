import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/eliminations/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    participant: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    elimination: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/eliminations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/eliminations', () => {
    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    const mockParticipant = {
      id: 'participant123',
      userId: 'user123',
      gameId: 'game123',
      status: 'ALIVE',
      targetId: 'target123',
      game: {
        id: 'game123',
        status: 'ACTIVE',
      },
      target: {
        id: 'target123',
        status: 'ALIVE',
      },
    };

    const mockTargetParticipant = {
      id: 'target123',
      status: 'ALIVE',
    };

    it('should create an elimination successfully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.participant.findFirst as jest.Mock).mockResolvedValue(mockParticipant);
      (prisma.participant.findUnique as jest.Mock).mockResolvedValue(mockTargetParticipant);
      (prisma.elimination.create as jest.Mock).mockResolvedValue({
        id: 'elimination123',
        gameId: 'game123',
        eliminatorId: 'participant123',
        victimId: 'target123',
      });

      const request = new NextRequest('http://localhost:3000/api/eliminations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: 'target123',
          killerSignature: 'data:image/png;base64,signature',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.eliminationId).toBe('elimination123');
      expect(data.message).toContain('Pendent de confirmació');
    });

    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/eliminations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: 'target123',
          killerSignature: 'data:image/png;base64,signature',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if user is not an active participant', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.participant.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/eliminations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: 'target123',
          killerSignature: 'data:image/png;base64,signature',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No ets un participant actiu en cap joc');
    });

    it('should return 400 if target ID does not match', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.participant.findFirst as jest.Mock).mockResolvedValue({
        ...mockParticipant,
        targetId: 'different-target',
      });

      const request = new NextRequest('http://localhost:3000/api/eliminations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: 'target123',
          killerSignature: 'data:image/png;base64,signature',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Aquesta no és la teva víctima assignada');
    });

    it('should return 400 if target is already eliminated', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.participant.findFirst as jest.Mock).mockResolvedValue(mockParticipant);
      (prisma.participant.findUnique as jest.Mock).mockResolvedValue({
        id: 'target123',
        status: 'ELIMINATED',
      });

      const request = new NextRequest('http://localhost:3000/api/eliminations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: 'target123',
          killerSignature: 'data:image/png;base64,signature',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('La víctima ja ha estat eliminada');
    });

    it('should return 400 for invalid request data', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/eliminations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
          targetId: 'target123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dades invàlides');
      expect(data.details).toBeDefined();
    });
  });

  describe('GET /api/eliminations', () => {
    const mockSession = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    const mockEliminations = [
      {
        id: 'elim1',
        timestamp: new Date('2024-01-01'),
        killerSignature: 'signature1',
        victim: {
          id: 'victim1',
          nickname: 'Victim 1',
          group: 'Group A',
          photo: null,
          userId: 'user1',
        },
      },
      {
        id: 'elim2',
        timestamp: new Date('2024-01-02'),
        killerSignature: 'signature2',
        victim: {
          id: 'victim2',
          nickname: 'Victim 2',
          group: 'Group B',
          photo: null,
          userId: 'user2',
        },
      },
    ];

    it('should return confirmed eliminations for cemetery', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.participant.findFirst as jest.Mock).mockResolvedValue({
        id: 'participant123',
        userId: 'user123',
        gameId: 'game123',
      });
      (prisma.elimination.findMany as jest.Mock).mockResolvedValue(mockEliminations);

      const request = new NextRequest('http://localhost:3000/api/eliminations?gameId=game123&confirmed=true');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('timestamp');
      expect(data[0]).toHaveProperty('killerSignature');
      expect(data[0]).toHaveProperty('victim');
    });

    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/eliminations?gameId=game123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if gameId is missing', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/eliminations');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('gameId is required');
    });

    it('should return 403 if user has no access to the game', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.participant.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user123',
        role: 'PLAYER',
      });

      const request = new NextRequest('http://localhost:3000/api/eliminations?gameId=game123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('No tens accés a aquest joc');
    });
  });
}); 