/**
 * Generates the HTML page for Swagger UI using CDN-hosted assets.
 *
 * @param specUrl - URL to the OpenAPI JSON spec endpoint
 */
export function buildSwaggerHtml(specUrl: string): string {
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
		SwaggerUIBundle({ url: '${specUrl}', dom_id: '#swagger-ui' });
	</script>
</body>
</html>`;
}
