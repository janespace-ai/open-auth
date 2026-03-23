import { ICapabilityRegistry } from "./interfaces";
import { CapabilityDefinition, AuthRequest, AuthResponse } from "./types";

export class CapabilityRegistry implements ICapabilityRegistry {
  private capabilities = new Map<string, CapabilityDefinition>();

  register(capability: CapabilityDefinition): void {
    this.capabilities.set(capability.id, capability);
  }

  get(id: string): CapabilityDefinition | undefined {
    return this.capabilities.get(id);
  }

  getAll(): CapabilityDefinition[] {
    return Array.from(this.capabilities.values());
  }

  getIds(): string[] {
    return Array.from(this.capabilities.keys());
  }

  async route(request: AuthRequest): Promise<AuthResponse> {
    const cap = this.capabilities.get(request.capability);
    if (!cap) {
      return {
        requestId: request.requestId,
        status: "error",
        error: { code: "UNSUPPORTED_CAPABILITY", message: `Capability "${request.capability}" is not supported` },
      };
    }

    const validation = cap.handler.validate(request.params);
    if (!validation.valid) {
      return {
        requestId: request.requestId,
        status: "error",
        error: { code: "INVALID_PARAMS", message: validation.error || "Invalid parameters" },
      };
    }

    try {
      const result = await cap.handler.execute(request.action, request.params);
      return { requestId: request.requestId, status: "approved", result };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        requestId: request.requestId,
        status: "error",
        error: { code: "EXECUTION_ERROR", message },
      };
    }
  }
}
