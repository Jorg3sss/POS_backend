# Guia de Configuracion: POS Backend (NestJS + Prisma 7)

Sigue estos pasos en orden para levantar el entorno de desarrollo.

## Paso 1: Preparar archivos de entorno
Accede a la carpeta del proyecto y genera el archivo .env a partir del ejemplo:

cd POS_backend
cp .env.example .env

Nota: Verifica que la variable DATABASE_URL coincida con las credenciales definidas en el archivo docker-compose.yml.

## Paso 2: Levantar Base de Datos (Docker)
Asegurate de tener Docker Desktop iniciado. Este comando creara y levantara el contenedor de PostgreSQL en segundo plano:

docker-compose up -d

## Paso 3: Instalar dependencias
Instala los modulos necesarios del proyecto, incluyendo los requeridos por la version 7 de Prisma:

npm install
npm install --save-dev @prisma/config dotenv

## Paso 4: Sincronizar Prisma
Debido a las restricciones de la version 7.5.0, la configuracion de la base de datos se gestiona a traves de prisma.config.ts. Ejecuta los siguientes comandos para generar el cliente y crear las tablas:

npx prisma generate
npx prisma db push



## Paso 5: Visualizar la Base de Datos (pgAdmin)
Para gestionar los datos visualmente:
1. Abre pgAdmin 4.
2. Registra un nuevo servidor (Register > Server).
3. En la pestaña Connection ingresa:
   - Host name: localhost
   - Port: 5432
   - Maintenance database: pos_db
   - Username: (El definido en tu .env)
   - Password: (La definida en tu .env)

## Paso 6: Iniciar el servidor
Arranca el servidor de NestJS en modo desarrollo:

npm run start:dev

---

## Notas de Desarrollo
1. Error P1012: Si encuentras este error, es porque la URL de la base de datos esta definida en el archivo .prisma. En la version 7, esta debe residir exclusivamente en prisma.config.ts.
2. Rutas de Archivos: Se recomienda evitar el uso de carpetas sincronizadas con la nube (como OneDrive o Dropbox) para prevenir errores de permisos en la carpeta node_modules.
3. Actualizacion de Esquema: Cada vez que realices un cambio en prisma/schema.prisma, debes volver a ejecutar npx prisma generate y npx prisma db push.