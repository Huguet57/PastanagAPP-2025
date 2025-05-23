# Persistent Killer Signatures

## Overview

The Pastanaga Assassina app now supports persistent killer signatures. Each participant can have a unique signature that persists across all their eliminations. If a participant changes their signature, it automatically updates across all their previous confirmed eliminations.

## How It Works

### 1. Database Schema

The system uses two signature fields:
- `Participant.signature`: Stores the participant's current signature
- `Elimination.killerSignature`: Stores the signature used for each elimination

### 2. Signature Management

When a participant reports an elimination:
1. The system checks if they already have a signature stored
2. If they have an existing signature, it's loaded and displayed in the canvas
3. The participant can choose to:
   - Keep their existing signature
   - Draw a new signature (which will update all their previous eliminations)

### 3. Automatic Updates

When a participant creates or updates their signature:
1. The new signature is saved to their participant record
2. All their previous confirmed eliminations are updated with the new signature
3. This ensures consistency across the entire game history

### 4. API Endpoints

- `GET /api/participants/me/signature`: Fetches the current participant's signature
- `POST /api/eliminations`: Creates eliminations and updates participant signatures

### 5. User Experience

1. **First Elimination**: The participant draws their signature for the first time
2. **Subsequent Eliminations**: Their existing signature is pre-loaded, but they can change it
3. **Cemetery View**: All eliminations show the killer's current signature as a clue

## Benefits

1. **Identity Persistence**: Each killer maintains a consistent identity throughout the game
2. **Mystery Element**: Players can analyze signatures in the cemetery to identify patterns
3. **Flexibility**: Participants can update their signature if they want to change their "style"
4. **Data Consistency**: All historical data remains consistent when signatures change

## Technical Implementation

The implementation uses database transactions to ensure data consistency:

```typescript
await prisma.$transaction(async (tx) => {
  // Update participant signature
  await tx.participant.update({
    where: { id: participant.id },
    data: { signature: newSignature }
  });

  // Update all previous eliminations
  await tx.elimination.updateMany({
    where: { 
      eliminatorId: participant.id,
      confirmed: true
    },
    data: { killerSignature: newSignature }
  });
});
```

This ensures that either all updates succeed or none do, maintaining data integrity. 