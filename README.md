Paso 1: Preparar archivos
Ejecuta estos uno a uno:

PowerShell
cd backend
PowerShell
cp .env.example .env
Paso 2: Levantar Base de Datos (Docker)
Asegúrate de tener Docker Desktop abierto antes de lanzar este:

PowerShell
docker-compose up -d
Paso 3: Instalar dependencias
Este puede tardar un poco dependiendo de tu internet:

PowerShell
npm install
Paso 4: Sincronizar Prisma
Esto preparará las tablas en PostgreSQL para guardar tus productos:

PowerShell
npx prisma generate
PowerShell
npx prisma db push
Paso 5: Iniciar el servidor
Finalmente, arranca NestJS:

PowerShell
npm run start:dev