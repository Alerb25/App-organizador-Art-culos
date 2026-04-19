# Aplicación organizador de Artículos
Esta es una aplicación Single Page Application (SPA) desarrollada con React que funciona como un frontend independiente para un CMS Drupal. 
El proyecto permite gestionar artículos corporativos consumiendo la JSON:API de Drupal, permitiendo no solo la visualización, sino también la gestión administrativa de contenidos.

# Objetivos
El propósito principal fue desarrollar una interfaz moderna y ágil para la organización de contenido de una página web corporativa basada en Drupal.

Se seleccionó React como framework de JS por su alta demanda en el mercado actual y su eficiencia en el manejo del estado. La estructura del proyecto se basa en el template 
estándar de React con Vite para un desarrollo rápido y optimizado.

# Características Principales
- Consumo de API: Uso de JSON:API para obtener nodos de tipo "Article" y sus taxonomías.
- Relaciones: Inclusión de etiquetas (field_tags) mediante el parámetro include en las peticiones.
- SEO Friendly: Soporte para alias de URL internos de Drupal para redirecciones externas.

## Gestión de Usuarios (Editor)
 - Autenticación OAuth2: Sistema de login que obtiene un access_token mediante el flujo de client_credentials.
 - Sesión Persistente: Almacenamiento del token en localStorage para mantener la sesión activa al recargar.

## Funcionalidades CRUD
- Lectura: Listado dinámico con filtros por título (búsqueda en tiempo real) y por categoría (taxonomía).
- Creación: Formulario para publicar nuevos artículos directamente en Drupal.
- Edición: Edición inline de artículos existentes mediante peticiones PATCH.
- Eliminación: Borrado de nodos con confirmación previa y manejo de errores de sesión caducada.

# Configuración y Variables de Entorno
Para que la aplicación funcione correctamente, es necesario configurar un archivo .env en la raíz del proyecto con las siguientes variables:
> DRUPAL_BASE_URL=https://tu-sitio-drupal.com
> VALID_USERNAME=tu_usuario_editor
> VALID_PASSWORD=tu_password_seguro

# Instalación y Uso 
1. Clonar el Repositorio
   >   git clone https://github.com/Alerb25/App-organizadora-Art-culos
2. Instalar dependencias:
   > npm install
3. Iniciar en modo desarrollo:
   > npm run dev
