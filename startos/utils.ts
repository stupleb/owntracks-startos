// Constants shared across the package.

// Frontend web UI listens here; exposed to users as the Web UI interface.
export const frontendPort = 80

// MQTT broker plain-text listener — bound to 127.0.0.1 only, used by the
// recorder to subscribe to phone publications. Never exposed.
export const mqttPlainPort = 1883

// MQTT broker TLS listener — exposed to phones as the MQTT (TLS) interface.
export const mqttTlsPort = 8883

// MQTT broker WebSocket listener — exposed via the MQTT (WebSocket) interface
// as an HTTP-routed alternative path. Because StartOS terminates TLS on HTTP
// interfaces with a dual-stack proxy, this listener also lets clients reach
// the broker over IPv6 / .local hostnames where the raw-TCP listener can't.
export const mqttWsPort = 8884

// Recorder HTTP API — frontend reads track data from here. Bound to
// 127.0.0.1 only.
export const recorderPort = 8083
