# 🛡️ Guia d'Administració - Pastanaga Assassin

## 📍 Com accedir als panells d'administració

### 1. Dashboard Principal (`/dashboard`)

Quan inicies sessió, seràs redirigit automàticament al dashboard. Si ets un usuari amb rol **ADMIN** o **ORGANIZER**, veuràs:

- **Botó "Panell d'Administració Complet"**: T'envia al panell complet de gestió
- **Accions ràpides**: Gestionar eliminacions, veure rànquing i cementiri

### 2. Panell d'Administració Complet (`/admin`)

Aquest és el panell principal per als organitzadors. Des d'aquí pots:

- **Crear nous jocs**
- **Veure tots els jocs** (actius, pausats, finalitzats)
- **Gestionar participants**
- **Veure estadístiques**

### 3. Rutes específiques d'administració:

- `/admin` - Panell principal amb llista de jocs
- `/admin/games/new` - Crear un nou joc
- `/admin/games/[gameId]` - Gestionar un joc específic
- `/admin/games/[gameId]/participants` - Gestionar participants d'un joc

## 🚀 Flux de treball per crear un joc

### 1. Crear un nou joc
1. Ves a `/admin` o clica el botó "Panell d'Administració Complet" al dashboard
2. Clica "Crear Nou Joc"
3. Omple el formulari amb:
   - Nom del joc
   - Descripció (opcional)
   - Dates d'inici i final (opcional)
4. Clica "Crear Joc"

### 2. Afegir participants
Després de crear el joc, seràs redirigit automàticament a la pàgina de participants. Aquí pots:

#### Opció A: Importar CSV
1. Prepara un fitxer CSV amb format:
   ```
   Nom,Grup
   Maria García,3r ESO - A
   Joan Martínez,3r ESO - A
   ```
2. Clica "Carregar CSV"
3. Selecciona el fitxer

#### Opció B: Afegir manualment
1. Clica "Afegir Manual"
2. Omple el nom i grup
3. Opcionalment, afegeix una foto

### 3. Generar usuaris i assignar objectius
1. Revisa la llista de participants
2. Clica "Generar Usuaris i Assignar Objectius"
3. El sistema:
   - Crearà usuaris automàticament amb emails únics
   - Generarà contrasenyes aleatòries
   - Assignarà objectius de forma aleatòria en cadena circular
   - Descarregarà automàticament un CSV amb les credencials

### 4. Gestionar el joc
Des de `/admin/games/[gameId]` pots:
- **Iniciar el joc** (passar de SETUP a ACTIVE)
- **Pausar/reprendre** el joc
- **Finalitzar** el joc
- **Veure participants** i els seus objectius
- **Descarregar llista** de participants

## 🔐 Rols i permisos

### ADMIN
- Accés complet a tots els panells
- Pot crear i gestionar jocs
- Pot aprovar/rebutjar eliminacions
- Veu tota la informació dels participants

### ORGANIZER
- Mateix accés que ADMIN
- Pensat per a co-organitzadors

### PLAYER
- Només accés al dashboard de jugador
- No pot accedir a `/admin/*`
- Només veu la seva pròpia informació

## 📝 Notes importants

1. **Mínim 3 participants**: No es pot generar un joc amb menys de 3 participants
2. **Emails automàtics**: Els emails es generen com `nom@pastanaga.local`
3. **Contrasenyes**: Es generen automàticament amb 8 caràcters aleatoris
4. **CSV de credencials**: Es descarrega automàticament després de generar usuaris
5. **Fotos**: Es guarden en base64 a la base de dades

## 🐛 Troubleshooting

### "No puc accedir a /admin"
- Verifica que el teu usuari té rol ADMIN o ORGANIZER a la base de dades
- Tanca sessió i torna a iniciar-la

### "Error generant usuaris"
- Verifica que tens almenys 3 participants
- Comprova que no hi ha emails duplicats

### "No es descarrega el CSV"
- Comprova que el navegador permet descàrregues automàtiques
- Busca el fitxer a la carpeta de descàrregues 