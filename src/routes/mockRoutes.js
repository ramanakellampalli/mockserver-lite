const { faker } = require('@faker-js/faker');
const Ajv = require('ajv');
const ajv = new Ajv();

// In-memory store for stateful endpoints
const stateStore = {};

function generateMockRoutes(app, schema) {
  if (!schema.paths) return;

  Object.keys(schema.paths).forEach((rawPath) => {
    const methods = schema.paths[rawPath];

    if (!methods) return; // <-- safety check

    // Convert OpenAPI path '/users/{id}' to Express format '/users/:id'
    const expressPath = rawPath.replace(/{(\w+)}/g, ':$1');

    Object.keys(methods).forEach((method) => {
      const responses = methods[method].responses;

      if (!responses) return; // <-- skip if no responses defined

      app[method](expressPath, (req, res) => {
        // 1️⃣ Status code selection
        const statusCode = parseInt(req.query.status) || parseInt(Object.keys(responses)[0], 10);

        // 2️⃣ Delay handling
        let delay = parseInt(req.query.delay) || 0;
        const minDelay = parseInt(req.query.minDelay) || delay;
        const maxDelay = parseInt(req.query.maxDelay) || delay;
        if (maxDelay > minDelay) {
          delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        }

        // 3️⃣ Request body validation (for POST/PUT)
        const schemaBody = methods[method].requestBody?.content?.['application/json']?.schema;
        if (schemaBody) {
          const validate = ajv.compile(schemaBody);
          const valid = validate(req.body);
          if (!valid) {
            return res.status(400).json({ error: 'Invalid request body', details: validate.errors });
          }
        }

        // 4️⃣ Get example response
        let example = responses[statusCode]?.content?.['application/json']?.example || {};

        // 5️⃣ Stateful endpoints
        const key = expressPath.replace(/[:\/]/g, '_');
        if (!stateStore[key]) stateStore[key] = [];

        // Store POST/PUT payloads
        if ((method === 'post' || method === 'put') && Object.keys(req.body).length > 0) {
          stateStore[key].push(req.body);
        }

        // Return stored data for GET if exists
        if (method === 'get' && stateStore[key].length > 0) {
          example = stateStore[key];
        }

        // 6️⃣ Randomize array items using faker
        if (Array.isArray(example)) {
          example = example.map(item => {
            const newItem = { ...item };
            Object.keys(newItem).forEach(k => {
              if (typeof newItem[k] === 'string' && newItem[k].startsWith('faker:')) {
                newItem[k] = generateFaker(newItem[k].split(':')[1]);
              }
            });
            return newItem;
          });
        }

        // 7️⃣ Respond after delay
        setTimeout(() => res.status(statusCode).json(example), delay);
      });
    });
  });
}

function generateFaker(type) {
  switch (type) {
    case 'name': return faker.person.fullName();
    case 'email': return faker.internet.email();
    case 'uuid': return faker.string.uuid();
    case 'address': return faker.location.streetAddress();
    case 'company': return faker.company.name();
    default: return 'mock';
  }
}

module.exports = { generateMockRoutes, stateStore };
