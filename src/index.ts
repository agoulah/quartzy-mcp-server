#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  TextContent,
  ImageContent,
} from "@modelcontextprotocol/sdk/types.js";

interface QuartzyConfig {
  accessToken: string;
  baseUrl?: string;
}

class QuartzyMCPServer {
  private server: Server;
  private config: QuartzyConfig;

  constructor() {
    this.server = new Server(
      {
        name: "quartzy-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.config = {
      accessToken: process.env.QUARTZY_ACCESS_TOKEN || "",
      baseUrl: process.env.QUARTZY_BASE_URL || "https://api.quartzy.com",
    };

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Health Check
          {
            name: "quartzy_health_check",
            description: "Check the health status of the Quartzy API service",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },

          // User
          {
            name: "quartzy_get_current_user",
            description: "Get information about the current authenticated user",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },

          // Labs
          {
            name: "quartzy_list_labs",
            description: "Get a list of labs, optionally filtered by organization",
            inputSchema: {
              type: "object",
              properties: {
                organization_id: {
                  type: "string",
                  description: "The Organization ID to filter on (UUID format)",
                },
                page: {
                  type: "number",
                  description: "The page of results to retrieve",
                },
              },
            },
          },
          {
            name: "quartzy_get_lab",
            description: "Get details of a specific lab by ID",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The UUID of the lab to retrieve",
                },
              },
              required: ["id"],
            },
          },

          // Inventory Items
          {
            name: "quartzy_list_inventory_items",
            description: "List and filter inventory items",
            inputSchema: {
              type: "object",
              properties: {
                page: {
                  type: "number",
                  description: "The page of results to retrieve",
                },
                lab_id: {
                  type: "string",
                  description: "The Lab ID to filter on",
                },
              },
            },
          },
          {
            name: "quartzy_get_inventory_item",
            description: "Get details of a specific inventory item",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The UUID of the inventory item to retrieve",
                },
              },
              required: ["id"],
            },
          },
          {
            name: "quartzy_update_inventory_item_quantity",
            description: "Update the quantity of an inventory item",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the inventory item to update",
                },
                quantity: {
                  type: "string",
                  description: "The new quantity value",
                },
              },
              required: ["id", "quantity"],
            },
          },

          // Order Requests
          {
            name: "quartzy_list_order_requests",
            description: "List and filter order requests",
            inputSchema: {
              type: "object",
              properties: {
                page: {
                  type: "number",
                  description: "The page of results to retrieve",
                },
                lab_id: {
                  type: "string",
                  description: "The Lab ID to filter on",
                },
              },
            },
          },
          {
            name: "quartzy_get_order_request",
            description: "Get details of a specific order request",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The UUID of the order request to retrieve",
                },
              },
              required: ["id"],
            },
          },
          {
            name: "quartzy_create_order_request",
            description: "Create a new order request",
            inputSchema: {
              type: "object",
              properties: {
                lab_id: {
                  type: "string",
                  description: "The UUID of the lab",
                },
                type_id: {
                  type: "string",
                  description: "The UUID of the type",
                },
                name: {
                  type: "string",
                  description: "Name of the item being ordered",
                },
                vendor_product_id: {
                  type: "string",
                  description: "The UUID of the vendor product (optional)",
                },
                vendor_name: {
                  type: "string",
                  description: "Name of the vendor",
                },
                catalog_number: {
                  type: "string",
                  description: "Vendor catalog number",
                },
                price: {
                  type: "object",
                  properties: {
                    amount: {
                      type: "string",
                      description: "Price amount as string integer",
                    },
                    currency: {
                      type: "string",
                      description: "Currency code (e.g., USD)",
                    },
                  },
                  required: ["amount", "currency"],
                },
                quantity: {
                  type: "number",
                  description: "Quantity to order",
                },
                required_before: {
                  type: "string",
                  description: "Required date in YYYY-MM-DD format",
                },
                notes: {
                  type: "string",
                  description: "Additional notes",
                },
              },
              required: ["lab_id", "type_id", "name", "vendor_name", "catalog_number", "price", "quantity"],
            },
          },
          {
            name: "quartzy_update_order_request",
            description: "Update the status of an order request",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The UUID of the order request to update",
                },
                status: {
                  type: "string",
                  enum: ["CREATED", "CANCELLED", "APPROVED", "ORDERED", "BACKORDERED", "RECEIVED"],
                  description: "New status for the order request",
                },
              },
              required: ["id", "status"],
            },
          },

          // Types
          {
            name: "quartzy_list_types",
            description: "List and filter item types",
            inputSchema: {
              type: "object",
              properties: {
                lab_id: {
                  type: "string",
                  description: "The Lab UUID to filter on",
                },
                name: {
                  type: "string",
                  description: "The Type Name to filter on",
                },
                page: {
                  type: "number",
                  description: "The page of results to retrieve",
                },
              },
            },
          },

          // Webhooks
          {
            name: "quartzy_list_webhooks",
            description: "List and filter webhooks",
            inputSchema: {
              type: "object",
              properties: {
                organization_id: {
                  type: "string",
                  description: "The Organization UUID to filter on",
                },
                page: {
                  type: "number",
                  description: "The page of results to retrieve",
                },
              },
            },
          },
          {
            name: "quartzy_get_webhook",
            description: "Get details of a specific webhook",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The UUID of the webhook to retrieve",
                },
              },
              required: ["id"],
            },
          },
          {
            name: "quartzy_create_webhook",
            description: "Create a new webhook for lab or organization events",
            inputSchema: {
              type: "object",
              properties: {
                lab_id: {
                  type: "string",
                  description: "The Lab UUID (use either lab_id or organization_id)",
                },
                organization_id: {
                  type: "string",
                  description: "The Organization UUID (use either lab_id or organization_id)",
                },
                name: {
                  type: "string",
                  description: "Name for the webhook",
                },
                url: {
                  type: "string",
                  description: "URL endpoint for the webhook",
                },
                event_types: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of event types to subscribe to",
                },
                is_enabled: {
                  type: "boolean",
                  description: "Whether the webhook is enabled",
                },
                is_verified: {
                  type: "boolean",
                  description: "Whether the webhook URL is verified",
                },
                is_signed: {
                  type: "boolean",
                  description: "Whether webhook payloads should be signed",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "quartzy_update_webhook",
            description: "Update webhook settings (currently only supports enabling/disabling)",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The UUID of the webhook to update",
                },
                is_enabled: {
                  type: "boolean",
                  description: "Whether the webhook should be enabled",
                },
              },
              required: ["id", "is_enabled"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Cast args to a more specific type for better type safety
        const typedArgs = args as Record<string, unknown>;

        switch (name) {
          case "quartzy_health_check":
            return await this.healthCheck();

          case "quartzy_get_current_user":
            return await this.getCurrentUser();

          case "quartzy_list_labs":
            return await this.listLabs(
              this.getStringArg(typedArgs, 'organization_id'), 
              this.getNumberArg(typedArgs, 'page')
            );

          case "quartzy_get_lab":
            return await this.getLab(this.getRequiredStringArg(typedArgs, 'id'));

          case "quartzy_list_inventory_items":
            return await this.listInventoryItems(
              this.getStringArg(typedArgs, 'lab_id'), 
              this.getNumberArg(typedArgs, 'page')
            );

          case "quartzy_get_inventory_item":
            return await this.getInventoryItem(this.getRequiredStringArg(typedArgs, 'id'));

          case "quartzy_update_inventory_item_quantity":
            return await this.updateInventoryItemQuantity(
              this.getRequiredStringArg(typedArgs, 'id'), 
              this.getRequiredStringArg(typedArgs, 'quantity')
            );

          case "quartzy_list_order_requests":
            return await this.listOrderRequests(
              this.getStringArg(typedArgs, 'lab_id'), 
              this.getNumberArg(typedArgs, 'page')
            );

          case "quartzy_get_order_request":
            return await this.getOrderRequest(this.getRequiredStringArg(typedArgs, 'id'));

          case "quartzy_create_order_request":
            return await this.createOrderRequest(typedArgs);

          case "quartzy_update_order_request":
            return await this.updateOrderRequest(
              this.getRequiredStringArg(typedArgs, 'id'), 
              this.getRequiredStringArg(typedArgs, 'status')
            );

          case "quartzy_list_types":
            return await this.listTypes(
              this.getStringArg(typedArgs, 'lab_id'), 
              this.getStringArg(typedArgs, 'name'), 
              this.getNumberArg(typedArgs, 'page')
            );

          case "quartzy_list_webhooks":
            return await this.listWebhooks(
              this.getStringArg(typedArgs, 'organization_id'), 
              this.getNumberArg(typedArgs, 'page')
            );

          case "quartzy_get_webhook":
            return await this.getWebhook(this.getRequiredStringArg(typedArgs, 'id'));

          case "quartzy_create_webhook":
            return await this.createWebhook(typedArgs);

          case "quartzy_update_webhook":
            return await this.updateWebhook(
              this.getRequiredStringArg(typedArgs, 'id'), 
              this.getRequiredBooleanArg(typedArgs, 'is_enabled')
            );

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  // Type-safe argument extraction helpers
  private getStringArg(args: Record<string, unknown>, key: string): string | undefined {
    const value = args[key];
    return typeof value === 'string' ? value : undefined;
  }

  private getRequiredStringArg(args: Record<string, unknown>, key: string): string {
    const value = this.getStringArg(args, key);
    if (!value) {
      throw new Error(`Required parameter '${key}' is missing or not a string`);
    }
    return value;
  }

  private getNumberArg(args: Record<string, unknown>, key: string): number | undefined {
    const value = args[key];
    return typeof value === 'number' ? value : undefined;
  }

  private getRequiredNumberArg(args: Record<string, unknown>, key: string): number {
    const value = this.getNumberArg(args, key);
    if (value === undefined) {
      throw new Error(`Required parameter '${key}' is missing or not a number`);
    }
    return value;
  }

  private getBooleanArg(args: Record<string, unknown>, key: string): boolean | undefined {
    const value = args[key];
    return typeof value === 'boolean' ? value : undefined;
  }

  private getRequiredBooleanArg(args: Record<string, unknown>, key: string): boolean {
    const value = this.getBooleanArg(args, key);
    if (value === undefined) {
      throw new Error(`Required parameter '${key}' is missing or not a boolean`);
    }
    return value;
  }

  private async makeRequest(
    endpoint: string,
    method: string = "GET",
    body?: any
  ): Promise<any> {
    if (!this.config.accessToken) {
      throw new Error("QUARTZY_ACCESS_TOKEN environment variable is required");
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Access-Token": this.config.accessToken,
      "Content-Type": "application/json",
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT")) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return null;
    }

    return await response.json();
  }

  private formatResponse(data: any, description: string): CallToolResult {
    return {
      content: [
        {
          type: "text",
          text: `${description}\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }

  // API Methods
  private async healthCheck(): Promise<CallToolResult> {
    const data = await this.makeRequest("/healthz");
    return this.formatResponse(data, "Quartzy API Health Status:");
  }

  private async getCurrentUser(): Promise<CallToolResult> {
    const data = await this.makeRequest("/user");
    return this.formatResponse(data, "Current User Information:");
  }

  private async listLabs(organizationId?: string, page?: number): Promise<CallToolResult> {
    let endpoint = "/labs";
    const params = new URLSearchParams();
    
    if (organizationId) params.append("organization_id", organizationId);
    if (page) params.append("page", page.toString());
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const data = await this.makeRequest(endpoint);
    return this.formatResponse(data, "Labs:");
  }

  private async getLab(id: string): Promise<CallToolResult> {
    if (!id) throw new Error("Lab ID is required");
    const data = await this.makeRequest(`/labs/${id}`);
    return this.formatResponse(data, `Lab Details (${id}):`);
  }

  private async listInventoryItems(labId?: string, page?: number): Promise<CallToolResult> {
    let endpoint = "/inventory-items";
    const params = new URLSearchParams();
    
    if (labId) params.append("lab_id", labId);
    if (page) params.append("page", page.toString());
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const data = await this.makeRequest(endpoint);
    return this.formatResponse(data, "Inventory Items:");
  }

  private async getInventoryItem(id: string): Promise<CallToolResult> {
    if (!id) throw new Error("Inventory Item ID is required");
    const data = await this.makeRequest(`/inventory-items/${id}`);
    return this.formatResponse(data, `Inventory Item Details (${id}):`);
  }

  private async updateInventoryItemQuantity(id: string, quantity: string): Promise<CallToolResult> {
    if (!id || !quantity) throw new Error("Both ID and quantity are required");
    const data = await this.makeRequest(`/inventory-items/${id}`, "PUT", { quantity });
    return this.formatResponse(data, `Updated Inventory Item (${id}):`);
  }

  private async listOrderRequests(labId?: string, page?: number): Promise<CallToolResult> {
    let endpoint = "/order-requests";
    const params = new URLSearchParams();
    
    if (labId) params.append("lab_id", labId);
    if (page) params.append("page", page.toString());
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const data = await this.makeRequest(endpoint);
    return this.formatResponse(data, "Order Requests:");
  }

  private async getOrderRequest(id: string): Promise<CallToolResult> {
    if (!id) throw new Error("Order Request ID is required");
    const data = await this.makeRequest(`/order-requests/${id}`);
    return this.formatResponse(data, `Order Request Details (${id}):`);
  }

  private async createOrderRequest(args: Record<string, unknown>): Promise<CallToolResult> {
    const requiredFields = ["lab_id", "type_id", "name", "vendor_name", "catalog_number", "price", "quantity"];
    
    // Validate required fields
    for (const field of requiredFields) {
      if (!args[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Build the request object with proper typing
    const requestData = {
      lab_id: this.getRequiredStringArg(args, 'lab_id'),
      type_id: this.getRequiredStringArg(args, 'type_id'),
      name: this.getRequiredStringArg(args, 'name'),
      vendor_name: this.getRequiredStringArg(args, 'vendor_name'),
      catalog_number: this.getRequiredStringArg(args, 'catalog_number'),
      price: args.price, // This should be an object, we'll validate it in the API call
      quantity: args.quantity, // This should be a number
      vendor_product_id: this.getStringArg(args, 'vendor_product_id'),
      required_before: this.getStringArg(args, 'required_before'),
      notes: this.getStringArg(args, 'notes'),
    };

    // Remove undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(requestData).filter(([_, value]) => value !== undefined)
    );

    const data = await this.makeRequest("/order-requests", "POST", cleanedData);
    return this.formatResponse(data, "Created Order Request:");
  }

  private async updateOrderRequest(id: string, status: string): Promise<CallToolResult> {
    if (!id || !status) throw new Error("Both ID and status are required");
    
    const validStatuses = ["CREATED", "CANCELLED", "APPROVED", "ORDERED", "BACKORDERED", "RECEIVED"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(", ")}`);
    }

    const data = await this.makeRequest(`/order-requests/${id}`, "PUT", { status });
    return this.formatResponse(data, `Updated Order Request (${id}):`);
  }

  private async listTypes(labId?: string, name?: string, page?: number): Promise<CallToolResult> {
    let endpoint = "/types";
    const params = new URLSearchParams();
    
    if (labId) params.append("lab_id", labId);
    if (name) params.append("name", name);
    if (page) params.append("page", page.toString());
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const data = await this.makeRequest(endpoint);
    return this.formatResponse(data, "Types:");
  }

  private async listWebhooks(organizationId?: string, page?: number): Promise<CallToolResult> {
    let endpoint = "/webhooks";
    const params = new URLSearchParams();
    
    if (organizationId) params.append("organization_id", organizationId);
    if (page) params.append("page", page.toString());
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const data = await this.makeRequest(endpoint);
    return this.formatResponse(data, "Webhooks:");
  }

  private async getWebhook(id: string): Promise<CallToolResult> {
    if (!id) throw new Error("Webhook ID is required");
    const data = await this.makeRequest(`/webhooks/${id}`);
    return this.formatResponse(data, `Webhook Details (${id}):`);
  }

  private async createWebhook(args: Record<string, unknown>): Promise<CallToolResult> {
    const url = this.getRequiredStringArg(args, 'url');
    
    // Must have either lab_id or organization_id
    const labId = this.getStringArg(args, 'lab_id');
    const organizationId = this.getStringArg(args, 'organization_id');
    
    if (!labId && !organizationId) {
      throw new Error("Either lab_id or organization_id is required");
    }

    // Build the request object
    const requestData = {
      url,
      lab_id: labId,
      organization_id: organizationId,
      name: this.getStringArg(args, 'name'),
      event_types: args.event_types, // Should be an array
      is_enabled: this.getBooleanArg(args, 'is_enabled'),
      is_verified: this.getBooleanArg(args, 'is_verified'),
      is_signed: this.getBooleanArg(args, 'is_signed'),
    };

    // Remove undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(requestData).filter(([_, value]) => value !== undefined)
    );

    const data = await this.makeRequest("/webhooks", "POST", cleanedData);
    return this.formatResponse(data, "Created Webhook:");
  }

  private async updateWebhook(id: string, isEnabled: boolean): Promise<CallToolResult> {
    if (!id || typeof isEnabled !== "boolean") {
      throw new Error("Both ID and is_enabled (boolean) are required");
    }

    const data = await this.makeRequest(`/webhooks/${id}`, "PUT", { is_enabled: isEnabled });
    return this.formatResponse(data, `Updated Webhook (${id}):`);
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Quartzy MCP Server running on stdio");
  }
}

const server = new QuartzyMCPServer();
server.run().catch(console.error);