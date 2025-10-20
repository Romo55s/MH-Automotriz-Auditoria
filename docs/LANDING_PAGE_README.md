# Landing Page del Sistema de Inventario Automotriz

## 🎯 Descripción

La landing page es la primera impresión que tienen los usuarios del sistema de inventario automotriz. Está diseñada siguiendo el design system de MH Automotriz con un estilo moderno, profesional y atractivo.

## 🎨 Características del Design

### Colores (siguiendo desing-syestm.json)
- **Fondo**: Negro (`#000000`)
- **Texto Principal**: Blanco (`#FFFFFF`)
- **Texto Secundario**: Gris claro (`#CCCCCC`)
- **Acentos**: Gradiente amarillo-naranja (`#f6d365` a `#fda085`)
- **Bordes**: Gris oscuro (`#333333`)

### Elementos Visuales
- **Elementos flotantes 3D**: Formas abstractas con efectos de vidrio y gradientes
- **Animaciones suaves**: Transiciones y efectos hover con Framer Motion
- **Gradientes sutiles**: Fondos con gradientes de baja opacidad
- **Tipografía**: Sans-serif, bold, uppercase para títulos

## 🚀 Funcionalidades

### Secciones Principales
1. **Hero Section**: Título principal con CTA buttons
2. **Features Section**: 6 características principales del sistema
3. **Video Demo Section**: Área para mostrar video explicativo
4. **CTA Section**: Llamada a la acción final
5. **Footer**: Información de la empresa

### Interactividad
- **Botones animados**: Efectos hover y click con escalado
- **Elementos flotantes**: Animaciones continuas de elementos 3D
- **Modal de video**: Ventana emergente para mostrar demo
- **Scroll animations**: Elementos que aparecen al hacer scroll

## 📱 Responsive Design

La landing page está completamente optimizada para:
- **Desktop**: Experiencia completa con todas las animaciones
- **Tablet**: Adaptación de grid y espaciados
- **Mobile**: Layout vertical optimizado para pantallas pequeñas

## 🎬 Integración de Video

### Cómo agregar tu video:

1. **Sube tu video a YouTube o Vimeo**
2. **Copia la URL de embed** (ej: `https://www.youtube.com/embed/VIDEO_ID`)
3. **Actualiza el componente VideoModal**:

```tsx
<VideoModal
  isOpen={isVideoModalOpen}
  onClose={() => setIsVideoModalOpen(false)}
  title="Demo del Sistema de Inventario Automotriz"
  videoUrl="https://www.youtube.com/embed/TU_VIDEO_ID" // Tu video aquí
/>
```

### Formatos soportados:
- YouTube (embed)
- Vimeo (embed)
- Videos locales (MP4, WebM)

## 🛠️ Tecnologías Utilizadas

- **React 19**: Framework principal
- **Framer Motion**: Animaciones y transiciones
- **Tailwind CSS**: Estilos y responsive design
- **Lucide React**: Iconos modernos
- **TypeScript**: Tipado estático

## 📂 Estructura de Archivos

```
src/components/common/display/
├── LandingPage.tsx          # Componente principal
└── index.ts                # Exportaciones

src/components/common/modals/
├── VideoModal.tsx          # Modal para video
└── index.ts               # Exportaciones
```

## 🎯 Rutas

- **`/landing`**: Landing page principal
- **`/login`**: Página de login (accesible desde landing)
- **`/select-agency`**: Selección de agencia (después del login)

## 🔧 Personalización

### Cambiar colores:
Edita las clases de Tailwind en `LandingPage.tsx`:
```tsx
// Cambiar gradiente principal
className="bg-gradient-to-r from-yellow-400 to-orange-400"

// Cambiar colores de fondo
className="bg-black" // o el color que prefieras
```

### Modificar contenido:
- **Títulos**: Edita los textos en las secciones
- **Características**: Modifica el array de features
- **Estadísticas**: Cambia los números en la sección de stats
- **Logo**: Reemplaza `/MH Automotriz-White.png`

### Agregar nuevas secciones:
1. Crea la nueva sección con motion.div
2. Agrega las animaciones correspondientes
3. Sigue el patrón de diseño existente

## 🚀 Deployment

La landing page se despliega automáticamente con el resto de la aplicación:

```bash
npm run build
npm run deploy:netlify  # o deploy:vercel
```

## 📊 Performance

- **Lazy loading**: Componentes se cargan bajo demanda
- **Optimized images**: Logo optimizado para web
- **Smooth animations**: 60fps con Framer Motion
- **Responsive images**: Adaptación automática de tamaños

## 🎨 Design System Compliance

La landing page sigue estrictamente el design system definido en `desing-syestm.json`:

- ✅ Paleta de colores correcta
- ✅ Tipografía consistente
- ✅ Espaciados uniformes
- ✅ Efectos hover apropiados
- ✅ Elementos 3D flotantes
- ✅ Gradientes sutiles

## 🔍 Testing

Para probar la landing page:

```bash
npm start
# Navega a http://localhost:3000/landing
```

## 📝 Notas Importantes

1. **Logo**: Asegúrate de que `/MH Automotriz-White.png` existe en la carpeta `public`
2. **Video**: El modal funciona sin video, pero se recomienda agregar uno
3. **Responsive**: Prueba en diferentes dispositivos
4. **Performance**: Las animaciones están optimizadas para no afectar el rendimiento

## 🎯 Próximos Pasos

- [ ] Agregar video explicativo real
- [ ] Implementar analytics de conversión
- [ ] Agregar testimonios de usuarios
- [ ] Crear versión A/B para testing
- [ ] Optimizar para SEO
