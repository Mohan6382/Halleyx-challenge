# Custom Dashboard Builder (MERN)

A full-stack Dashboard and Orders management platform featuring a deeply customizable React drag-and-drop grid interface, built on the MERN stack (MongoDB, Express, React.js, Node.js).

## Features
- **Dynamic Configurable Dashboards**: Drag and drop KPI widgets, Data Grids, and fully-interactive Charts (Bar, Line, Pie, Area, Scatter).
- **Date Filtering & Real-time Aggregation**: Backend handles live aggregations against millions of documents effortlessly contextually tied to Date ranges (Today, Last 7, Last 30, All Time).
- **Secure Authentication**: Built-in full JWT verification flow for registering and logging into user accounts.
- **RESTful Order API**: Fully schema-validated Order entry platform via `express-validator` mapping precisely to Country codes and Service types.
- **High-Fidelity Tailwind CSS**: Uniquely styled frontend ensuring 100% responsiveness (12 columns on Desktop down to 4 on Mobile).

## Folder Structure

```
/
├── frontend/                 # React frontend (Vite)
│   ├── src/                  # React source files
│   │   ├── components/       # Reusable UI elements (Navbar, ProtectedRoute)
│   │   ├── pages/            # Login, Register, Dashboard, DashboardConfigure, Orders
│   │   ├── App.jsx           # Main generic routing and wrapper
│   │   └── index.css         # Tailwind V4 entrypoint
│   └── package.json          
└── backend/                  # Node.js + Express backend
    ├── config/               # db.js Mongoose connection 
    ├── controllers/          # Business logic handlers for Auth, Orders, Config, Aggregations
    ├── middleware/           # auth.js (JWT Bearer Token verification)
    ├── models/               # CustomerOrder, DashboardConfig, User
    ├── routes/               # Express routing tables mapping to controllers
    ├── server.js             # Root application core (CORS, Express JSON, Routing)
    └── package.json          
```

Video link - https://drive.google.com/file/d/1WoLZjDzUG-EVg90QW5AdmrPRa2ivFnQX/view?usp=sharing


## Environment Variables (.env)
Create a `.env` hidden file in the root of the `/backend` folder. Follow this exact schema format to ensure standard configuration:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.zvd5ale.mongodb.net/workflow_engine?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=supersecret12345
```

## Installation & Running Locally

1. **Install and Run Database Backend (`/backend`)**:
```bash
cd backend
npm install
npm run serve  # or `nodemon server.js` / `node server.js`
```
Ensure MongoDB network IP access is granted to your current host or 0.0.0.0/0. Database API will boot on `http://localhost:5000`.

2. **Install and Run UI Client (`/frontend`)**:
```bash
cd frontend
npm install
npm run dev
```
The application UI runs explicitly via Vite on `http://localhost:5173`. Wait for the compiler to link `@tailwindcss/vite` automatically before proceeding to the browser.

## Key Technical Decisions
- **`react-grid-layout`**: Selected for the dashboard core since it natively supports multi-breakpoint 2D geometry mappings with drag handles.
- **`recharts`**: Installed for dynamic data ingestion—scales cleanly and perfectly binds JSON payloads dynamically computed by Mongoose MongoDB Aggregations on the Express side.
- **TotalAmount Computations**: The backend Model guarantees mathematical perfection via:
  ```javascript
  customerOrderSchema.pre('save', function (next) {
    if (this.quantity && this.unitPrice) {
      this.totalAmount = this.quantity * this.unitPrice;
    }
  });
  ```
