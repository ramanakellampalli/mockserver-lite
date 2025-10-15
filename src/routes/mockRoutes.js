const { faker } = require('@faker-js/faker');
const fs = require('fs');
const yaml = require('js-yaml');

function generateMockRoutes(app, schema) {
  if (!schema.paths) return;

  Object.keys(schema.paths).forEach((path) => {
    const methods = schema.paths[path];

    Object.keys(methods).forEach((method) => {
      const responses = methods[method].responses;

      app[method](path, (req, res) => {
        // 1️⃣ Status code selection
        const statusCode = parseInt(req.query.status) || parseInt(Object.keys(responses)[0], 10);

        // 2️⃣ Delay handling
        let delay = parseInt(req.query.delay) || 0;
        const minDelay = parseInt(req.query.minDelay) || delay;
        const maxDelay = parseInt(req.query.maxDelay) || delay;
        if (maxDelay > minDelay) {
          delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        }

        // 3️⃣ Generate example response
        let example = responses[statusCode]?.content?.['application/json']?.example || {};

        // 4️⃣ Randomize data if it's an array of objects
        if (Array.isArray(example)) {
          example = example.map(item => {
            const newItem = { ...item };
            Object.keys(newItem).forEach(key => {
              if (typeof newItem[key] === 'string' && newItem[key].includes('faker:')) {
                const fakerType = newItem[key].split(':')[1];
                newItem[key] = generateFaker(fakerType);
              }
            });
            return newItem;
          });
        }

        setTimeout(() => res.status(statusCode).json(example), delay);
      });
    });
  });
}

// Helper: Map simple faker strings to actual faker functions
function generateFaker(type) {
  switch(type) {
    case 'name': return faker.person.fullName();
    case 'email': return faker.internet.email();
    case 'uuid': return faker.string.uuid();
    case 'address': return faker.location.streetAddress();
    case 'company': return faker.company.name();
    default: return 'mock';
  }
}

module.exports = { generateMockRoutes };
