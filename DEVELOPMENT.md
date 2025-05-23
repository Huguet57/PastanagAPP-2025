# 🛠️ Guia de Desenvolupament - Pastanaga Assassin

## 🚀 Començar a Desenvolupar

### 1. Configuració Inicial Ràpida
```bash
# Executa l'script de configuració automàtica
./scripts/setup.sh

# O manualment:
npm install
cp .env.example .env.local  # Edita les variables necessàries
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## 📋 Próximes Funcionalitats a Implementar

### Fase 1: Funcionalitat Core (Setmana 1-2)

#### 1.1 Dashboard Bàsic
- [ ] **Dashboard per a jugadors** (`src/app/dashboard/page.tsx`)
  - Mostrar informació del joc actual
  - Víctima assignada
  - Estat del jugador (viu/eliminat)
  - Botó per reportar eliminació

#### 1.2 Sistema d'Eliminacions
- [ ] **Formulari d'eliminació** (`src/components/forms/elimination-form.tsx`)
  - Camp per introduir method d'eliminació
  - Canvas per signatura de la víctima
  - Camp per testimonis
  - Localització opcional

#### 1.3 API Routes Bàsiques
- [ ] **API per eliminacions** (`src/app/api/eliminations/route.ts`)
  - POST: Crear nova eliminació
  - GET: Obtenir eliminacions d'un joc
- [ ] **API per participants** (`src/app/api/participants/route.ts`)
  - GET: Obtenir participants d'un joc
  - POST: Afegir participant a joc

### Fase 2: Game Logic (Setmana 3-4)

#### 2.1 Sistema de Creació de Jocs
- [ ] **Pàgina de creació de joc** (`src/app/admin/games/new/page.tsx`)
  - Formulari per configurar nou joc
  - Afegir regles personalitzades
  - Configurar dates d'inici/final

#### 2.2 Algoritme d'Assignació de Víctimes
- [ ] **Lògica d'assignació** (`src/lib/game-logic.ts`)
  - Implementar cadena tancada d'eliminacions
  - Reasignació automàtica després d'eliminació
  - Validació que no hi hagin cadenes trencades

#### 2.3 Sistema de Estats del Joc
- [ ] **Gestió d'estats** (`src/lib/game-states.ts`)
  - SETUP → ACTIVE → PAUSED → ENDED
  - Transicions automàtiques i manuals
  - Validacions per cada estat

### Fase 3: Features Avançades (Setmana 5-6)

#### 3.1 Canvas de Signatures
- [ ] **Component de signatura** (`src/components/ui/signature-canvas.tsx`)
  - Canvas HTML5 per dibuixar signatures
  - Conversió a base64
  - Validació de signatures

#### 3.2 Sistema de Confirmació
- [ ] **Workflow de confirmació** (`src/components/game/elimination-confirmation.tsx`)
  - Notificació a organitzadors
  - Aprovació/rebuig d'eliminacions
  - Resolució de conflictes

#### 3.3 Rànquing i Estadístiques
- [ ] **Component de rànquing** (`src/components/game/leaderboard.tsx`)
  - Llistat d'assassins per puntuació
  - Estadístiques de temps de supervivència
  - Historial d'eliminacions

### Fase 4: Panel d'Administració (Setmana 7-8)

#### 4.1 Dashboard d'Organitzador
- [ ] **Pàgina d'admin** (`src/app/admin/page.tsx`)
  - Vista general de tots els jocs
  - Estadístiques globals
  - Accions ràpides

#### 4.2 Gestió de Participants
- [ ] **Gestió massiva** (`src/app/admin/participants/page.tsx`)
  - Import CSV de participants
  - Assignació de rols
  - Activació/desactivació en bloc

#### 4.3 Monitoratge en Temps Real
- [ ] **Component de monitoratge** (`src/components/admin/real-time-monitor.tsx`)
  - WebSockets per actualitzacions en viu
  - Mapa d'eliminacions
  - Alertes d'activitat sospitosa

## 🗂️ Estructura de Components Recomanada

```
src/components/
├── ui/                     # Components UI reutilitzables
│   ├── button.tsx         ✅ Fet
│   ├── card.tsx           ⏳ Pendent
│   ├── input.tsx          ⏳ Pendent
│   ├── dialog.tsx         ⏳ Pendent
│   └── signature-canvas.tsx ⏳ Pendent
├── forms/                 # Formularis específics
│   ├── elimination-form.tsx ⏳ Pendent
│   ├── game-form.tsx      ⏳ Pendent
│   └── participant-form.tsx ⏳ Pendent
├── game/                  # Components específics del joc
│   ├── target-card.tsx    ⏳ Pendent
│   ├── leaderboard.tsx    ⏳ Pendent
│   ├── game-status.tsx    ⏳ Pendent
│   └── elimination-history.tsx ⏳ Pendent
└── admin/                 # Components d'administració
    ├── participant-manager.tsx ⏳ Pendent
    ├── game-monitor.tsx   ⏳ Pendent
    └── elimination-approval.tsx ⏳ Pendent
```

## 🎨 Disseny i UI/UX

### Colors i Tematització
- **Primari**: Gradients de pastanaga (#f59e32 → #e66b06)
- **Estat Viu**: Verd (#22c55e)
- **Estat Eliminat**: Vermell (#ef4444) amb opacitat
- **Accent**: Groc/Daurat per guanyadors

### Components UI a Crear
1. **Card Component**: Per mostrar participants i eliminacions
2. **Badge Component**: Per estats i etiquetes
3. **Dialog Component**: Per confirmacions i modals
4. **Input Components**: Formularis consistents
5. **Loading States**: Spinners amb tema pastanaga

## 🧪 Testing

### Configuració de Testing
```bash
# Afegir dependències de testing
npm install -D @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# Configurar Jest
# Crear jest.config.js i jest.setup.js
```

### Tests Prioritaris
1. **Utils Functions**: Algoritmes de game logic
2. **API Routes**: Endpoints crítics
3. **Components**: Components de formularis
4. **Integration**: Workflow d'eliminació complet

## 🚀 Deployment

### Preparació per a Producció
1. **Variables d'entorn**: Configurar per a producció
2. **Database**: Migrar a PostgreSQL per a producció
3. **File Storage**: Configurar per a imatges i signatures
4. **Monitoring**: Afegir logs i mètriques

### Opcions de Deployment
- **Vercel** (recomanat): Deploy automàtic des de Git
- **Railway**: PostgreSQL + deploy fàcil
- **DigitalOcean App Platform**: Més control
- **Heroku**: Opció clàssica

## 📝 Convencions de Codi

### Naming
- **Files**: kebab-case (`elimination-form.tsx`)
- **Components**: PascalCase (`EliminationForm`)
- **Functions**: camelCase (`createTargetChain`)
- **Constants**: SCREAMING_SNAKE_CASE (`GAME_STATES`)

### Git Workflow
```bash
# Branches per feature
git checkout -b feature/elimination-system
git checkout -b fix/auth-redirect
git checkout -b refactor/database-schema

# Commits descriptius
git commit -m "feat: add elimination reporting form"
git commit -m "fix: resolve auth redirect loop"
git commit -m "refactor: simplify game logic utils"
```

## 🐛 Debug i Troubleshooting

### Problemes Comuns
1. **Prisma Client**: `npm run db:generate` després de canvis al schema
2. **NextAuth Session**: Verificar variables NEXTAUTH_URL i NEXTAUTH_SECRET
3. **CORS**: Configurar dominis permesos per a producció
4. **Database**: Verificar connexió i migracions

### Logs Útils
```typescript
// Afegir logs en desenvolupament
console.log('🎯 Target assigned:', targetId)
console.log('💀 Elimination created:', elimination)
console.log('👤 User authenticated:', session.user)
```

---

**Consell**: Comença sempre pels tests i la funcionalitat core abans d'afegir features avançades. El joc ha de ser jugable des del primer dia!

🥕 Happy coding! 