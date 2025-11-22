# Configuración de Importación de Menú con AI

## Funcionalidad

La aplicación Barflow ahora incluye una potente funcionalidad de importación de menú usando Google Gemini AI. Los usuarios pueden:

1. **Subir archivos** en formato CSV o Excel (.xlsx, .xls)
2. **Parseo automático con AI** - Google Gemini extrae automáticamente los datos
3. **Mapeo inteligente** - El AI identifica: nombre, cantidad, unidad y categoría
4. **Integración perfecta** - Los datos se agregan directamente al planner

## Configuración

### 1. Obtener API Key de Google Gemini

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Get API Key" o "Create API Key"
4. Copia la clave generada

### 2. Configurar la Variable de Entorno

Abre el archivo `.env.local` y reemplaza `your_gemini_api_key_here` con tu clave real:

```bash
GEMINI_API_KEY=tu_clave_api_aqui
```

### 3. Reiniciar el Servidor de Desarrollo

Después de configurar la API key, reinicia el servidor:

```bash
npm run dev
```

## Uso

### Formato de Archivo Esperado

El AI puede parsear archivos con columnas como:

**CSV Example:**
```csv
Nombre,Cantidad,Unidad,Categoría
Ron Blanco,2,L,Licores
Coca Cola,12,L,Refrescos
Limones,20,units,Frutas
```

**Excel Example:**
| Nombre | Cantidad | Unidad | Categoría |
|--------|----------|--------|-----------|
| Ron Blanco | 2 | L | Licores |
| Coca Cola | 12 | L | Refrescos |
| Limones | 20 | units | Frutas |

### Notas:
- El AI es flexible con los nombres de columnas (puede reconocer "Nombre", "nombre", "Name", "Producto", etc.)
- Si falta información, usa valores por defecto razonables
- Campos adicionales son ignorados automáticamente
- Las categorías se normalizan a: Licores, Refrescos, Especias, Frutas, Otros

## Proceso de Importación

1. Navega al **Planner** (`/demo/planner` o `/dashboard/planner`)
2. Haz clic en la sección **"Importar Menú"**
3. Haz clic para seleccionar tu archivo CSV o Excel
4. Clic en **"Importar"**
5. El AI procesará el archivo (toma 2-5 segundos)
6. Los insumos aparecerán automáticamente en el planner, seleccionados por defecto
7. Ajusta cantidades si es necesario
8. Haz clic en **"Completar Plan"** para guardar

## Estructura de Datos

Los insumos importados se convierten a este formato:

```typescript
{
  id: string,          // Generado automáticamente
  name: string,        // Nombre del insumo
  quantity: number,    // Cantidad numérica
  unit: string,        // Unidad de medida (L, kg, ml, units, etc.)
  category: string,    // Categoría normalizada
  selected: boolean    // Siempre true para imports
}
```

## Troubleshooting

### "GEMINI_API_KEY not configured"
- Verifica que hayas configurado la clave en `.env.local`
- Reinicia el servidor de desarrollo

### "Failed to parse AI response"
- Verifica que el archivo tenga un formato válido
- Asegúrate de que tenga al menos columnas de nombre y cantidad
- Intenta con un archivo más simple primero

### El archivo no se procesa
- Formatos soportados: `.csv`, `.xlsx`, `.xls`
- Tamaño máximo recomendado: 1 MB
- Máximo recomendado: 500 items

## Tecnologías Utilizadas

- **Google Gemini 2.0 Flash** - AI para parseo inteligente
- **XLSX** - Procesamiento de archivos Excel
- **PapaParse** - Procesamiento de archivos CSV
- **Next.js API Routes** - Backend de procesamiento

## Seguridad

- La API key debe mantenerse en `.env.local` (nunca commit al repositorio)
- Los archivos se procesan en el servidor y no se almacenan
- Solo se envía el contenido del archivo al AI para parsing
- Los datos parseados se guardan localmente en el navegador o Supabase
