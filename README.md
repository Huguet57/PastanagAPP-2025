# 🥕 Pastanaga Assassin - Webapp

Una webapp moderna per jugar al clàssic joc de l'Assassí de la Pastanaga (Killer Carrot), desenvolupada amb Next.js, TypeScript i Tailwind CSS.

## 📋 Característiques

### Funcionalitats Principals
- 🔐 **Sistema d'autenticació** amb NextAuth.js
- 👥 **Gestió de participants** amb registre i perfils
- 🎯 **Assignació automàtica** de víctimes en cadena tancada
- 💀 **Sistema d'eliminacions** amb confirmació i seguiment
- 📊 **Rànquing i estadístiques** en temps real
- ✍️ **Signatures digitals** per confirmar eliminacions
- 👑 **Panel d'administració** per organitzadors
- 📱 **Disseny responsive** i modern

### Tecnologies Utilitzades
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Base de dades**: SQLite amb Prisma ORM
- **Autenticació**: NextAuth.js
- **Deployment**: Vercel (recomanat)

## 🚀 Configuració Inicial

### Pre-requisits
- Node.js 18+ 
- npm, yarn o pnpm

### Instal·lació

1. **Clona el repositori i instal·la dependències**
```bash
cd pastanagapp2
npm install
```

2. **Configura les variables d'entorn**
```bash
# Crea un fitxer .env.local a l'arrel del projecte
touch .env.local
```

Afegeix el següent contingut a `.env.local`:
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="el-teu-secret-key-aqui"

# App Settings
APP_NAME="Pastanaga Assassin"
APP_URL="http://localhost:3000"
```

3. **Configura la base de dades**
```bash
# Genera el client Prisma
npm run db:generate

# Crea la base de dades i executa migracions
npm run db:push
```

4. **Executa el servidor de desenvolupament**
```bash
npm run dev
```

L'aplicació estarà disponible a [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Projecte

```
src/
├── app/                          # App Router (Next.js 14)
│   ├── api/                      # API Routes
│   │   └── auth/                 # NextAuth endpoints
│   ├── auth/                     # Pàgines d'autenticació
│   ├── dashboard/                # Dashboard principal
│   ├── admin/                    # Panel d'administració
│   └── game/                     # Pàgines del joc
├── components/                   # Components reutilitzables
│   ├── ui/                       # Components UI bàsics
│   ├── forms/                    # Formularis
│   └── providers/                # Context providers
├── lib/                          # Utilitats i configuració
│   ├── auth.ts                   # Configuració NextAuth
│   ├── db.ts                     # Client Prisma
│   └── utils.ts                  # Funcions utilitàries
└── types/                        # Definicions TypeScript
```

## 🎮 Pla de Desenvolupament

### Fase 1: Core Functionality (Setmana 1-2)
- [x] Configuració inicial del projecte
- [x] Sistema d'autenticació bàsic
- [ ] Models de base de dades
- [ ] CRUD bàsic per usuaris i jocs
- [ ] Dashboard inicial

### Fase 2: Game Logic (Setmana 3-4)
- [ ] Sistema de creació de jocs
- [ ] Algoritme d'assignació de víctimes (cadena tancada)
- [ ] Sistema d'eliminacions
- [ ] Validació de regles del joc
- [ ] Notificacions bàsiques

### Fase 3: Advanced Features (Setmana 5-6)
- [ ] Signatures digitals
- [ ] Sistema de confirmació d'eliminacions
- [ ] Rànquing i estadístiques avançades
- [ ] Panel d'administració complet
- [ ] Gestió de permisos per rols

### Fase 4: UI/UX & Polish (Setmana 7-8)
- [ ] Disseny responsive millorat
- [ ] Animacions i transicions
- [ ] Mode fosc
- [ ] Optimització de rendiment
- [ ] Testing automatitzat

### Fase 5: Deployment & Production (Setmana 9)
- [ ] Configuració de producció
- [ ] Deployment a Vercel
- [ ] Monitorització i logs
- [ ] Documentació final

## 🔧 Comandos Disponibles

```bash
# Desenvolupament
npm run dev              # Inicia servidor de desenvolupament
npm run build            # Build de producció
npm run start            # Inicia servidor de producció
npm run lint             # Executa linter

# Base de dades
npm run db:generate      # Genera client Prisma
npm run db:push          # Aplica canvis a la BD
npm run db:migrate       # Crea nova migració
npm run db:seed          # Pobla la BD amb dades d'exemple
```

## 🎯 Funcionalitats del Joc

### Per a Jugadors
1. **Registre i Login**: Creació de compte i autenticació
2. **Perfil**: Configuració de nickname, curs, foto i signatura
3. **Víctima Actual**: Visualització de qui han d'eliminar
4. **Reportar Eliminació**: Sistema per confirmar eliminacions
5. **Estat del Joc**: Veure rànquing i estadístiques

### Per a Organitzadors
1. **Crear Joc**: Configuració de nova partida
2. **Gestió de Participants**: Afegir/eliminar jugadors
3. **Configurar Regles**: Definició de regles personalitzades
4. **Monitoratge**: Seguiment en temps real del joc
5. **Resolució de Conflictes**: Confirmar/rebutjar eliminacions

## 🎨 Tematització

L'aplicació utilitza una paleta de colors inspirada en pastanagues:
- **Primari**: Tonos taronges (#f59e32, #e66b06)
- **Secundari**: Grocs i marrons complementaris
- **Accent**: Verds per elements especials

## 🚢 Deployment

### Vercel (Recomanat)
1. Connecta el repositori a Vercel
2. Configura les variables d'entorn
3. Deploy automàtic a cada push

### Variables d'entorn de producció:
```env
DATABASE_URL="el-teu-database-url-de-producció"
NEXTAUTH_URL="https://el-teu-domini.vercel.app"
NEXTAUTH_SECRET="secret-segur-de-producció"
```

## 🧪 Testing

```bash
# Executar tests
npm run test

# Tests amb coverage
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 📚 Documentació Addicional

- [Prisma Documentation](https://www.prisma.io/docs/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contribució

1. Fork el repositori
2. Crea una branca per la teva feature (`git checkout -b feature/nova-funcionalitat`)
3. Commit els canvis (`git commit -am 'Afegeix nova funcionalitat'`)
4. Push a la branca (`git push origin feature/nova-funcionalitat`)
5. Crea un Pull Request

## 📄 Llicència

Aquest projecte està sota la llicència MIT. Veure `LICENSE` per més detalls.

---

**Fet amb 🥕 per l'equip de Pastanaga Assassin** 