# ☕ Cafetería Escolar con Reconocimiento Facial

Aplicación móvil desarrollada como proyecto final para la gestión de una cafetería escolar utilizando **Reconocimiento Facial mediante Inteligencia Artificial**.

El sistema permite registrar usuarios mediante fotografías, autenticar su identidad usando DeepFace y realizar pedidos desde una aplicación móvil desarrollada en React Native.

---

# 📱 Características

- 📸 Registro facial mediante captura automática de imágenes.
- 🤖 Autenticación biométrica utilizando DeepFace.
- 👤 Gestión de usuarios.
- 📦 Gestión de productos.
- 🏷 Gestión de categorías.
- 🛒 Carrito de compras.
- 🧾 Creación de órdenes.
- 📜 Historial de pedidos.
- 📡 API REST desarrollada con FastAPI.
- 💾 Base de datos SQLite mediante SQLAlchemy.

---

# 🛠 Tecnologías utilizadas

## Backend

- Python 3.11
- FastAPI
- SQLAlchemy
- SQLite
- DeepFace
- OpenCV
- Uvicorn
- Pydantic

## Frontend

- React Native
- Expo
- TypeScript

---

# 📂 Arquitectura

```
Cafe_git
│
├── backend
│   ├── app
│   │   ├── routers
│   │   ├── services
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── main.py
│   │
│   └── data
│       └── dataset
│
└── menu_cafeteria_9A
    ├── components
    ├── assets
    ├── App.tsx
    └── package.json
```

---

# 🚀 Funcionalidades

## Registro facial

El usuario captura automáticamente 30 fotografías desde la aplicación móvil.

Las imágenes son enviadas al backend y almacenadas para crear el dataset facial.

---

## Inicio de sesión

El usuario toma una fotografía.

DeepFace compara la imagen contra el dataset almacenado.

Si la similitud supera el umbral establecido, el acceso es concedido.

---

## Menú

El usuario puede:

- Ver productos disponibles.
- Consultar precios.
- Consultar stock.

---

## Carrito

Permite:

- Agregar productos.
- Eliminar productos.
- Modificar cantidades.
- Calcular el total automáticamente.

---

## Órdenes

Después de confirmar la compra:

- Se crea una nueva orden.
- Se descuenta el stock.
- Se almacena en la base de datos.

---

## Historial

Cada usuario puede consultar:

- Número de pedido.
- Fecha.
- Estado.
- Total.
- Productos comprados.

---

# 📡 API REST

## Usuarios

```
GET /users
POST /users
```

## Categorías

```
GET /categories
POST /categories
PUT /categories/{id}
DELETE /categories/{id}
```

## Productos

```
GET /products
POST /products
PUT /products/{id}
DELETE /products/{id}
```

## Órdenes

```
GET /orders
GET /orders/user/{id}
POST /orders
```

## Reconocimiento facial

```
POST /upload-dataset
POST /auth/login-face
```

---

# ⚙ Instalación

## Clonar repositorio

```bash
git clone https://github.com/TU_USUARIO/cafeteria-facial.git
```

---

## Backend

```bash
cd backend

python -m venv .venv

.venv\Scripts\activate

pip install -r requirements.txt

python -m uvicorn app.main:app --reload
```

---

## Frontend

```bash
cd menu_cafeteria_9A

npm install

npx expo start
```

---

# 👨‍💻 Autor

**Alan Jesús Chávez González**

Ingeniería en Tecnologías de la Información e Innovación Digital

Universidad Tecnológica Metropolitana de Aguascalientes

GitHub:

https://github.com/Chavezgonzalez

LinkedIn:

https://www.linkedin.com/in/chavez-gonzalez-alan-jesus-720249241/

---

# 📄 Licencia

Proyecto desarrollado únicamente con fines académicos.
