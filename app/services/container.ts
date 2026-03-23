import type {
  IRelayService,
  IE2EEEngine,
  IKeyManager,
  ISigningEngine,
  ICapabilityRegistry,
  INotificationService,
} from "./interfaces";

class ServiceContainerClass {
  private _relay!: IRelayService;
  private _e2ee!: IE2EEEngine;
  private _keyManager!: IKeyManager;
  private _signing!: ISigningEngine;
  private _capabilities!: ICapabilityRegistry;
  private _notifications!: INotificationService;
  private _isDemoMode = false;

  get relay(): IRelayService {
    return this._relay;
  }
  get e2ee(): IE2EEEngine {
    return this._e2ee;
  }
  get keyManager(): IKeyManager {
    return this._keyManager;
  }
  get signing(): ISigningEngine {
    return this._signing;
  }
  get capabilities(): ICapabilityRegistry {
    return this._capabilities;
  }
  get notifications(): INotificationService {
    return this._notifications;
  }
  get isDemoMode(): boolean {
    return this._isDemoMode;
  }

  initialize(
    services: {
      relay: IRelayService;
      e2ee: IE2EEEngine;
      keyManager: IKeyManager;
      signing: ISigningEngine;
      capabilities: ICapabilityRegistry;
      notifications: INotificationService;
    },
    demoMode = false,
  ) {
    this._relay = services.relay;
    this._e2ee = services.e2ee;
    this._keyManager = services.keyManager;
    this._signing = services.signing;
    this._capabilities = services.capabilities;
    this._notifications = services.notifications;
    this._isDemoMode = demoMode;
  }
}

export const ServiceContainer = new ServiceContainerClass();
