#!/bin/bash

echo "🥕 Configurant Pastanagapp..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no està instal·lat. Si us plau, instal·la Node.js 18+ abans de continuar."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versió 18+ és requerit. Versió actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectat"

# Install dependencies
echo "📦 Instal·lant dependències..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creant fitxer .env.local..."
    cat > .env.local << EOL
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# App Settings
APP_NAME="Pastanagapp"
APP_URL="http://localhost:3000"
EOL
    echo "✅ Fitxer .env.local creat amb secret generat automàticament"
else
    echo "📄 Fitxer .env.local ja existeix"
fi

# Generate Prisma client
echo "🗄️ Generant client Prisma..."
npm run db:generate

# Setup database
echo "🏗️ Configurant base de dades..."
npm run db:push

# Seed database
echo "🌱 Poblant base de dades amb dades d'exemple..."
npm run db:seed

echo ""
echo "🎉 Configuració completada!"
echo ""
echo "Per començar el desenvolupament:"
echo "  npm run dev"
echo ""
echo "L'aplicació estarà disponible a: http://localhost:3000"
echo ""
echo "Comptes de prova:"
echo "  Admin: admin@pastanaga.app / admin123"
echo "  Organizer: organizer@pastanaga.app / organizer123"
echo "  Player: martina@student.com / player123"
echo ""
echo "🥕 Bon desenvolupament!" 