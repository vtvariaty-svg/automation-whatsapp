/**
 * GET /api/agent/openapi
 *
 * Returns the OpenAPI 3.0 spec for the curated agent tool surface.
 * OpenCrow ingests this spec to discover available tools.
 *
 * Spec covers read-only context tools + safe prepare-* action tools.
 * No destructive, billing, or provider-direct operations are exposed.
 *
 * Public endpoint — no auth required for spec discovery.
 * Tool endpoints themselves enforce auth via X-Agent-Secret.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.AGENT_GATEWAY_BASE_URL ?? 'https://app.variaty.com.br';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Variaty Agent Tool Surface',
    version: '1.0.0',
    description: 'Curated read and prepare tools for OpenCrow agent orchestration. All mutating actions (checkout execution, payments, scheduling) remain in the deterministic backend layer.',
  },
  servers: [{ url: BASE_URL }],
  security: [{ AgentSecret: [] }],
  components: {
    securitySchemes: {
      AgentSecret: {
        type: 'apiKey',
        in: 'header',
        name: 'x-agent-secret',
        description: 'Internal agent gateway secret. Pass alongside x-agent-tenant-id.',
      },
    },
    parameters: {
      TenantId: {
        name: 'x-agent-tenant-id',
        in: 'header',
        required: true,
        schema: { type: 'string' },
        description: 'Tenant scope for all tool calls.',
      },
    },
  },
  paths: {
    '/api/agent/context/contact': {
      get: {
        operationId: 'getContactContext',
        summary: 'Get contact profile and recent interaction summary for a customer phone number.',
        parameters: [
          { $ref: '#/components/parameters/TenantId' },
          { name: 'phone', in: 'query', required: true, schema: { type: 'string' }, description: 'Customer phone number (E.164 format preferred).' },
        ],
        responses: {
          200: {
            description: 'Contact context',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    found: { type: 'boolean' },
                    contactId: { type: 'string' },
                    name: { type: 'string' },
                    status: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    totalOrders: { type: 'number' },
                    totalAppointments: { type: 'number' },
                    lastInteractionAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/agent/context/conversation': {
      get: {
        operationId: 'getConversationContext',
        summary: 'Get recent conversation messages and status for a customer.',
        parameters: [
          { $ref: '#/components/parameters/TenantId' },
          { name: 'phone', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 6 }, description: 'Number of messages to return (max 10).' },
        ],
        responses: {
          200: {
            description: 'Recent conversation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', description: 'open | ai | human | waiting | closed' },
                    messageCount: { type: 'number' },
                    messages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          role: { type: 'string', enum: ['customer', 'assistant'] },
                          text: { type: 'string' },
                          createdAt: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/agent/context/channel-health': {
      get: {
        operationId: 'getChannelHealth',
        summary: 'Get enabled channels and connection status for the tenant.',
        parameters: [{ $ref: '#/components/parameters/TenantId' }],
        responses: {
          200: {
            description: 'Channel health',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    enabledChannels: { type: 'array', items: { type: 'string' } },
                    whatsappConnected: { type: 'boolean' },
                    instagramConnected: { type: 'boolean' },
                    facebookConnected: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/agent/context/plan-status': {
      get: {
        operationId: 'getPlanStatus',
        summary: 'Get tenant subscription plan and feature entitlements.',
        parameters: [{ $ref: '#/components/parameters/TenantId' }],
        responses: {
          200: {
            description: 'Plan and entitlements',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    plan: { type: 'string' },
                    status: { type: 'string' },
                    trialDaysLeft: { type: 'number', nullable: true },
                    features: { type: 'object' },
                    limits: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/agent/context/catalog': {
      get: {
        operationId: 'getCatalog',
        summary: 'Get active products and services for the tenant.',
        parameters: [
          { $ref: '#/components/parameters/TenantId' },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Optional search filter.' },
        ],
        responses: {
          200: {
            description: 'Active catalog',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          price: { type: 'number' },
                          category: { type: 'string' },
                          description: { type: 'string' },
                          hasExternalUrl: { type: 'boolean' },
                          requiresService: { type: 'boolean' },
                        },
                      },
                    },
                    services: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          durationMinutes: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/agent/context/payment-status': {
      get: {
        operationId: 'getPaymentStatus',
        summary: 'Get recent payment and order status for a customer.',
        parameters: [
          { $ref: '#/components/parameters/TenantId' },
          { name: 'phone', in: 'query', schema: { type: 'string' } },
          { name: 'contactId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Recent payments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recentOrders: { type: 'array', items: { type: 'object' } },
                    recentPayments: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/agent/actions/prepare-checkout': {
      post: {
        operationId: 'prepareCheckout',
        summary: 'Prepare checkout parameters for a product. Does NOT execute the payment — returns parameters for the backend to execute safely.',
        parameters: [{ $ref: '#/components/parameters/TenantId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'customerPhone'],
                properties: {
                  productId: { type: 'string' },
                  customerPhone: { type: 'string' },
                  contactId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Checkout preparation result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ready: { type: 'boolean' },
                    productId: { type: 'string' },
                    productName: { type: 'string' },
                    price: { type: 'number' },
                    currency: { type: 'string' },
                    requiresContact: { type: 'boolean' },
                    blockedReason: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/agent/actions/prepare-handoff': {
      post: {
        operationId: 'prepareHandoff',
        summary: 'Validate and prepare a human handoff. Does NOT execute the handoff — returns parameters for safe backend execution.',
        parameters: [{ $ref: '#/components/parameters/TenantId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerPhone', 'reason'],
                properties: {
                  customerPhone: { type: 'string' },
                  reason: { type: 'string', enum: ['explicit_request', 'ai_low_confidence', 'requires_human_approval', 'repetition'] },
                  contactId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Handoff preparation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    canHandoff: { type: 'boolean' },
                    currentStatus: { type: 'string' },
                    alreadyHuman: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/agent/actions/prepare-schedule': {
      post: {
        operationId: 'prepareSchedule',
        summary: 'Check scheduling availability and prepare booking parameters. Does NOT create appointments.',
        parameters: [{ $ref: '#/components/parameters/TenantId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  serviceId: { type: 'string' },
                  serviceName: { type: 'string' },
                  customerPhone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Scheduling preparation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    serviceFound: { type: 'boolean' },
                    serviceId: { type: 'string', nullable: true },
                    serviceName: { type: 'string', nullable: true },
                    hasAvailability: { type: 'boolean' },
                    schedulingEnabled: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/agent/actions/prepare-reply': {
      post: {
        operationId: 'prepareReply',
        summary: 'Validate a proposed reply text before sending (safety check, length check). Does NOT send the message.',
        parameters: [{ $ref: '#/components/parameters/TenantId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['replyText'],
                properties: {
                  replyText: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Reply validation result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    approved: { type: 'boolean' },
                    replyText: { type: 'string' },
                    blockedReason: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(spec, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
