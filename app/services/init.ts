import { ServiceContainer } from "./container";
import { E2EEEngine } from "./e2ee";
import { RelayService } from "./relay";
import { KeyManager } from "./key-manager";
import { SigningEngine } from "./signing";
import { CapabilityRegistry } from "./capabilities";
import { NotificationService } from "./notifications";
import {
  MockRelayService,
  MockE2EEEngine,
  MockKeyManager,
  MockSigningEngine,
  MockCapabilityRegistry,
  MockNotificationService,
} from "./mock";

export function initializeServices(demoMode: boolean) {
  if (demoMode) {
    ServiceContainer.initialize(
      {
        relay: new MockRelayService(),
        e2ee: new MockE2EEEngine(),
        keyManager: new MockKeyManager(),
        signing: new MockSigningEngine(),
        capabilities: new MockCapabilityRegistry(),
        notifications: new MockNotificationService(),
      },
      true
    );
  } else {
    const keyManager = new KeyManager();

    ServiceContainer.initialize(
      {
        relay: new RelayService(),
        e2ee: E2EEEngine,
        keyManager,
        signing: new SigningEngine(keyManager),
        capabilities: new CapabilityRegistry(),
        notifications: new NotificationService(),
      },
      false
    );
  }
}
