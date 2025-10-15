function generateMockRoutes(app, schema) {
  if (!schema.paths) return;

  Object.keys(schema.paths).forEach((path) => {
    const methods = schema.paths[path];
    Object.keys(methods).forEach((method) => {
      const response = methods[method].responses['200'] || methods[method].responses['201'];
      const example = response?.content?.['application/json']?.example || {};

      app[method](path, (req, res) => {
        const delay = parseInt(req.query.delay) || 0;
        const statusCode = parseInt(Object.keys(methods[method].responses)[0], 10); // Convert string to number

        setTimeout(() => res.status(statusCode).json(example), delay);
      });
    });
  });
}

module.exports = { generateMockRoutes };
