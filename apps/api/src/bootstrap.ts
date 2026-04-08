import { AgentRegistry } from "./platform/registry/agent-registry";
import { register as registerFinance } from "./agents/finance";

const registry = new AgentRegistry();

export function bootstrapAgents(): AgentRegistry {
  registerFinance(registry);
  // Phase 5: registerTravel(registry);
  return registry;
}
