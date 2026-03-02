/** Generates the HTML page for Swagger UI using CDN-hosted assets. */
export function buildSwaggerHtml(): string {
	const specUrl = '/api/openapi.json';

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<title>API Documentation</title>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.0/swagger-ui.css" />
</head>
<body>
	<div id="swagger-ui"></div>
	<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.0/swagger-ui-bundle.js"></script>
	<script>
		SwaggerUIBundle({ url: '${specUrl}', dom_id: '#swagger-ui' });
	</script>
</body>
</html>`;
}
