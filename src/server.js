const express = require('express');
const fs = require('fs');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');
const cors = require('cors');
const { generateMockRoutes } = require('./routes/mockRoutes');
const chokidar = require('chokidar');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Load YAML schema
const schemaFile = './src/schemas/example.yaml';
const schema = yaml.load(fs.readFileSync(schemaFile, 'utf8'));

chokidar.watch('./src/schemas').on('change', () => {
  console.log('Schema changed, reloading...');
  schema = yaml.load(fs.readFileSync(schemaFile, 'utf8'));
  generateMockRoutes(app, schema);
});

// Generate routes based on schema
generateMockRoutes(app, schema);

// Optional: UI to toggle response codes/delay
app.use('/ui', express.static('src/ui'));

const PORT = 4000;
app.listen(PORT, () => console.log(`MockServer Lite running at http://localhost:${PORT}`));
