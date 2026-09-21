// Hand-written OpenAPI spec so test cases can be generated from a contract
// rather than from prose. Served verbatim at GET /api/openapi.json.
export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "VZ Provisioning API",
    version: "1.0.0",
    description:
      "Circuit provisioning service for the IntelliQA demo. Owns the `prov` schema. Auth is the x-demo-user header carrying the actor's email (role must be 'provisioning').",
  },
  servers: [{ url: "/", description: "Same-origin" }],
  components: {
    securitySchemes: {
      demoUser: { type: "apiKey", in: "header", name: "x-demo-user" },
    },
    schemas: {
      Order: {
        type: "object",
        properties: {
          order_no: { type: "string", example: "ORD-1004" },
          circuit_id: { type: "string", nullable: true, example: "DHEC.100234..VZB" },
          customer_name: { type: "string" },
          account_no: { type: "string" },
          service_type: {
            type: "string",
            enum: ["ethernet", "dia", "mpls", "private_line"],
          },
          bandwidth_mbps: { type: "integer", enum: [10, 100, 500, 1000, 10000] },
          a_end_address: { type: "string" },
          z_end_address: { type: "string" },
          priority: { type: "string", enum: ["standard", "expedited", "critical"] },
          foc_date: { type: "string", format: "date" },
          status: {
            type: "string",
            enum: [
              "order_received",
              "on_hold",
              "in_design",
              "configured",
              "handed_off",
              "test_failed",
            ],
          },
          needs_field_dispatch: { type: "boolean" },
          rework_count: { type: "integer" },
        },
      },
      Error: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: false },
          error: {
            type: "string",
            enum: [
              "UNAUTHENTICATED",
              "FORBIDDEN_ROLE",
              "NOT_FOUND",
              "VALIDATION_FAILED",
              "ILLEGAL_TRANSITION",
              "PRECONDITION_FAILED",
              "INTERNAL",
            ],
          },
          message: { type: "string" },
        },
      },
    },
  },
  security: [{ demoUser: [] }],
  paths: {
    "/api/health": {
      get: { summary: "Health check", security: [], responses: { "200": { description: "up" } } },
    },
    "/api/orders": {
      get: {
        summary: "List orders",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "service_type", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "offset", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Order list" }, "401": { description: "UNAUTHENTICATED" }, "403": { description: "FORBIDDEN_ROLE" } },
      },
      post: {
        summary: "Create order",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } },
        responses: { "201": { description: "Created" }, "400": { description: "VALIDATION_FAILED" } },
      },
    },
    "/api/orders/{orderNo}": {
      get: {
        summary: "Get one order with tasks",
        parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Order" }, "404": { description: "NOT_FOUND" } },
      },
    },
    "/api/orders/{orderNo}/design/start": { post: { summary: "Start design (order_received -> in_design)", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "in_design" }, "409": { description: "ILLEGAL_TRANSITION" } } } },
    "/api/orders/{orderNo}/design/assign": { post: { summary: "Assign circuit id + design values, create tasks", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "circuit assigned" }, "409": { description: "ILLEGAL_TRANSITION / PRECONDITION_FAILED" } } } },
    "/api/orders/{orderNo}/tasks/{seq}/complete": { post: { summary: "Complete a task by seq", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }, { name: "seq", in: "path", required: true, schema: { type: "integer" } }], responses: { "200": { description: "task done" }, "404": { description: "NOT_FOUND" } } } },
    "/api/orders/{orderNo}/configure": { post: { summary: "Mark configured (blocked until all tasks done)", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "configured" }, "409": { description: "PRECONDITION_FAILED" } } } },
    "/api/orders/{orderNo}/handoff": { post: { summary: "Hand off to activation (copies row into act.work_orders)", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "handed_off" }, "409": { description: "ILLEGAL_TRANSITION / PRECONDITION_FAILED" } } } },
    "/api/orders/{orderNo}/rework": { post: { summary: "Rework a returned order (test_failed -> configured, rework_count+1)", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "configured" }, "409": { description: "ILLEGAL_TRANSITION" } } } },
    "/api/orders/{orderNo}/hold": { post: { summary: "Place on hold", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { hold_reason: { type: "string" } } } } } }, responses: { "200": { description: "on_hold" } } } },
    "/api/orders/{orderNo}/timeline": { get: { summary: "Order lifecycle audit trail", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "events" } } } },
  },
};
