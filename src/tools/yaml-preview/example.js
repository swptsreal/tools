export const yamlPreviewExample = `openapi: 3.0.3
info:
  title: Useful Tools API
  version: 1.0.0
  description: Offline API documentation preview.
servers:
  - url: https://api.example.test
paths:
  /tools:
    get:
      summary: List tools
      tags:
        - Tools
      responses:
        '200':
          description: Tool list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Tool'
components:
  schemas:
    Tool:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
`
