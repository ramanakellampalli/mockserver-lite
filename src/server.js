const express = require('express');
const fs = require('fs');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');
const cors = require('cors');
const chokidar = require('chokidar');
const path = require('path');
const { generateMockRoutes } = require('./routes/mockRoutes');
require('dotenv').config();

const PORT = process.env.MOCKSERVER_PORT || 4000;
const BASE_PATH = process.env.MOCKSERVER_BASE_PATH || '/';
const DEFAULT_DELAY = parseInt(process.env.MOCKSERVER_DELAY_DEFAULT) || 0;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = yaml.load(fs.readFileSync(path.join(__dirname,'schemas/swagger.yaml'),'utf8'));

// Serve UI
app.use(`${BASE_PATH}ui`, express.static('src/ui'));

// Load all schemas dynamically
const schemasDir = path.join(__dirname, 'schemas');
fs.readdirSync(schemasDir).forEach(file => {
  if (!file.endsWith('.yaml') && !file.endsWith('.json')) return;
  const fullPath = path.join(schemasDir, file);
  const content = yaml.load(fs.readFileSync(fullPath, 'utf8'));
  generateMockRoutes(app, content, { basePath: BASE_PATH, defaultDelay: DEFAULT_DELAY });
});

// Watch for schema changes
chokidar.watch('./src/schemas').on('change', () => {
  console.log('Schema changed, reloading routes...');
  fs.readdirSync(schemasDir).forEach(file => {
    if (!file.endsWith('.yaml') && !file.endsWith('.json')) return;
    const fullPath = path.join(schemasDir, file);
    const content = yaml.load(fs.readFileSync(fullPath, 'utf8'));
    generateMockRoutes(app, content, { basePath: BASE_PATH, defaultDelay: DEFAULT_DELAY });
  });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get(`${BASE_PATH}health`, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get(`${BASE_PATH}routes`, (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: middleware.route.methods
      });
    }
  });
  res.json(routes);
});


app.listen(PORT, () => console.log(`MockServer Lite running at http://localhost:${PORT}${BASE_PATH}`));
