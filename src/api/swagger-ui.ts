const SPEC_URL = '/api/openapi.json';

/** Generates the HTML page for Swagger UI using CDN-hosted assets. */
export function buildSwaggerHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<title>API Documentation</title>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
	<div id="swagger-ui"></div>
	<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
	<script>
		SwaggerUIBundle({ url: '${SPEC_URL}', dom_id: '#swagger-ui' });
	</script>
</body>
</html>`;
}
