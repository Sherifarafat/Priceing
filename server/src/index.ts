import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes.js'
import merchantsRoutes from './routes/merchants.routes.js'
import branchesRoutes from './routes/branches.routes.js'
import productsRoutes from './routes/products.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import servicesRoutes from './routes/services.routes.js'
import scanRoutes from './routes/scan.routes.js'
import reportsRoutes from './routes/reports.routes.js'
import usersRoutes from './routes/users.routes.js'
import feesRoutes from './routes/fees.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Priceing SaaS API Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// Mount Routes
app.use('/api/auth', authRoutes)
app.use('/api/merchants', merchantsRoutes)
app.use('/api/branches', branchesRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/scan', scanRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/fees', feesRoutes)

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 Priceing SaaS Backend Server running on http://localhost:${PORT}`)
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`)
})
