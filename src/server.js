const express = require('express');
const fs = require('fs');
const yaml = require('js-yaml');
const bodyParser = require('body-parser');
const cors = require('cors');
const chokidar = require('chokidar');
const { generateMockRoutes } = require('./routes/mockRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve UI
app.use('/ui', express.static('src/ui'));

const schemaFile = './src/schemas/example.yaml';
let schema = yaml.load(fs.readFileSync(schemaFile, 'utf8'));
generateMockRoutes(app, schema);

// Watch for schema changes
chokidar.watch('./src/schemas').on('change', () => {
  console.log('Schema changed, reloading routes...');
  schema = yaml.load(fs.readFileSync(schemaFile, 'utf8'));
  generateMockRoutes(app, schema);
});

const PORT = 4000;
app.listen(PORT, () => console.log(`MockServer Lite running at http://localhost:${PORT}`));
