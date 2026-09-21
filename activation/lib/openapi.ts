// Hand-written OpenAPI spec so test cases can be generated from a contract
// rather than from prose. Served verbatim at GET /api/openapi.json.
export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "VZ Activation API",
    version: "1.0.0",
    description:
      "Circuit activation service for the IntelliQA demo. Owns the `act` schema. Auth is the x-demo-user header carrying the actor's email (role must be 'activation').",
  },
  servers: [{ url: "/", description: "Same-origin" }],
  components: {
    securitySchemes: {
      demoUser: { type: "apiKey", in: "header", name: "x-demo-user" },
    },
    schemas: {
      WorkOrder: {
        type: "object",
        properties: {
          order_no: { type: "string", example: "ORD-1004" },
          source_order_no: { type: "string", example: "ORD-1004" },
          circuit_id: { type: "string", example: "DHEC.100234..VZB" },
          customer_name: { type: "string" },
          account_no: { type: "string" },
          service_type: { type: "string" },
          bandwidth_mbps: { type: "integer" },
          expected_test_count: { type: "integer", enum: [3, 4] },
          status: {
            type: "string",
            enum: [
              "ready_for_activation",
              "testing",
              "activated",
              "closed",
              "test_failed",
            ],
          },
          rework_count: { type: "integer" },
          received_at: { type: "string", format: "date-time" },
          activated_at: { type: "string", format: "date-time", nullable: true },
          closed_at: { type: "string", format: "date-time", nullable: true },
          propagation: {
            type: "object",
            properties: {
              from_system: { type: "string", example: "provisioning" },
              received_at: { type: "string", format: "date-time" },
              fields_received: { type: "integer", example: 9 },
            },
          },
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
    "/api/health": { get: { summary: "Health check", security: [], responses: { "200": { description: "up" } } } },
    "/api/queue": {
      get: {
        summary: "Activation queue (reads act.work_orders only)",
        parameters: [{ name: "status", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Work orders" }, "401": { description: "UNAUTHENTICATED" }, "403": { description: "FORBIDDEN_ROLE" } },
      },
    },
    "/api/orders/{orderNo}": {
      get: {
        summary: "Get work order with propagation metadata",
        parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Work order", content: { "application/json": { schema: { $ref: "#/components/schemas/WorkOrder" } } } },
          "401": { description: "UNAUTHENTICATED" },
          "403": { description: "FORBIDDEN_ROLE" },
          "404": { description: "NOT_FOUND" },
        },
      },
    },
    "/api/orders/{orderNo}/pickup": { post: { summary: "Pick up (ready_for_activation -> testing, creates tests)", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "testing" }, "409": { description: "ILLEGAL_TRANSITION" } } } },
    "/api/orders/{orderNo}/tests/{seq}/result": { post: { summary: "Record a test result", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }, { name: "seq", in: "path", required: true, schema: { type: "integer" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { result: { type: "string", enum: ["pass", "fail"] }, measured_value: { type: "string" } } } } } }, responses: { "200": { description: "recorded" }, "400": { description: "VALIDATION_FAILED" }, "404": { description: "NOT_FOUND" } } } },
    "/api/orders/{orderNo}/activate": { post: { summary: "Activate (blocked until all tests pass; fires netinv trigger)", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "activated" }, "409": { description: "ILLEGAL_TRANSITION" } } } },
    "/api/orders/{orderNo}/close": { post: { summary: "Close (activated -> closed)", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "closed" }, "409": { description: "ILLEGAL_TRANSITION" } } } },
    "/api/orders/{orderNo}/return": { post: { summary: "Return to provisioning with a reason", parameters: [{ name: "orderNo", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { failure_reason: { type: "string" } } } } } }, responses: { "200": { description: "test_failed" }, "400": { description: "VALIDATION_FAILED" }, "409": { description: "ILLEGAL_TRANSITION" } } } },
    "/api/demo/reset": { post: { summary: "Reset demo data (no auth)", security: [], responses: { "200": { description: "reset" } } } },
  },
};
