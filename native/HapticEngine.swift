import Foundation
import IOKit

// MARK: - MultitouchSupport Framework (Direct Linking)

@_silgen_name("MTActuatorCreateFromDeviceID")
func MTActuatorCreateFromDeviceID(_ deviceID: UInt64) -> OpaquePointer?

@_silgen_name("MTActuatorOpen")
func MTActuatorOpen(_ actuator: OpaquePointer) -> Int32

@_silgen_name("MTActuatorClose")
func MTActuatorClose(_ actuator: OpaquePointer) -> Int32

@_silgen_name("MTActuatorActuate")
func MTActuatorActuate(_ actuator: OpaquePointer, _ actuationID: Int32, _ unknown1: UInt32, _ unknown2: Float, _ unknown3: Float) -> Int32

// MARK: - Persistent Actuator State

var persistentActuator: OpaquePointer? = nil
var persistentDeviceID: UInt64 = 0

// MARK: - IOKit Device Discovery

func findTrackpadDeviceID() -> UInt64? {
    let matchingDict = IOServiceMatching("AppleMultitouchDevice") as NSMutableDictionary
    var iterator: io_iterator_t = 0
    
    let result = IOServiceGetMatchingServices(kIOMainPortDefault, matchingDict, &iterator)
    guard result == KERN_SUCCESS else {
        return nil
    }
    
    defer { IOObjectRelease(iterator) }
    
    var service = IOIteratorNext(iterator)
    while service != 0 {
        defer { 
            IOObjectRelease(service)
            service = IOIteratorNext(iterator)
        }
        
        guard let actuationRef = IORegistryEntryCreateCFProperty(
            service,
            "ActuationSupported" as CFString,
            kCFAllocatorDefault,
            0
        )?.takeRetainedValue() else {
            continue
        }
        
        guard CFGetTypeID(actuationRef) == CFBooleanGetTypeID(),
              CFBooleanGetValue((actuationRef as! CFBoolean)) else {
            continue
        }
        
        var isBuiltIn = false
        if let builtInRef = IORegistryEntryCreateCFProperty(
            service,
            "MT Built-In" as CFString,
            kCFAllocatorDefault,
            0
        )?.takeRetainedValue() {
            if CFGetTypeID(builtInRef) == CFBooleanGetTypeID() {
                isBuiltIn = CFBooleanGetValue((builtInRef as! CFBoolean))
            }
        }
        
        guard let deviceIDRef = IORegistryEntryCreateCFProperty(
            service,
            "Multitouch ID" as CFString,
            kCFAllocatorDefault,
            0
        )?.takeRetainedValue() else {
            continue
        }
        
        guard CFGetTypeID(deviceIDRef) == CFNumberGetTypeID() else {
            continue
        }
        
        var deviceID: Int64 = 0
        CFNumberGetValue((deviceIDRef as! CFNumber), .sInt64Type, &deviceID)
        
        let id = UInt64(bitPattern: deviceID)
        
        if isBuiltIn {
            return id
        }
        
        if persistentDeviceID == 0 {
            persistentDeviceID = id
        }
    }
    
    return persistentDeviceID != 0 ? persistentDeviceID : nil
}

// MARK: - Haptic Feedback

let ACTUATION_STRONG: Int32 = 6
let ACTUATION_MEDIUM: Int32 = 4
let ACTUATION_WEAK: Int32 = 3

func openActuator() -> Bool {
    if persistentActuator != nil {
        return true
    }
    
    guard let deviceID = findTrackpadDeviceID() else {
        if ProcessInfo.processInfo.environment["DEBUG"] != nil {
            fputs("DEBUG: No trackpad found\n", stderr)
        }
        return false
    }
    
    persistentDeviceID = deviceID
    
    guard let actuator = MTActuatorCreateFromDeviceID(deviceID) else {
        if ProcessInfo.processInfo.environment["DEBUG"] != nil {
            fputs("DEBUG: Failed to create actuator for device \(deviceID)\n", stderr)
        }
        return false
    }
    
    let openResult = MTActuatorOpen(actuator)
    if openResult != 0 {
        if ProcessInfo.processInfo.environment["DEBUG"] != nil {
            fputs("DEBUG: MTActuatorOpen failed with \(openResult)\n", stderr)
        }
        return false
    }
    
    persistentActuator = actuator
    
    if ProcessInfo.processInfo.environment["DEBUG"] != nil {
        fputs("DEBUG: Actuator opened for device \(deviceID)\n", stderr)
    }
    
    return true
}

func closeActuator() {
    if let actuator = persistentActuator {
        _ = MTActuatorClose(actuator)
        persistentActuator = nil
    }
}

func triggerHaptic(actuationID: Int32, intensity: Float) -> Bool {
    if !openActuator() {
        return false
    }
    
    guard let actuator = persistentActuator else {
        return false
    }
    
    let clampedActuationID = max(1, min(16, actuationID))
    let clampedIntensity = max(0.0, min(2.0, intensity))
    
    var actuateResult = MTActuatorActuate(actuator, clampedActuationID, 0, 0.0, clampedIntensity)
    
    if ProcessInfo.processInfo.environment["DEBUG"] != nil {
        fputs("DEBUG: MTActuatorActuate(id=\(clampedActuationID), intensity=\(clampedIntensity)) = \(actuateResult)\n", stderr)
    }
    
    if actuateResult != 0 {
        if ProcessInfo.processInfo.environment["DEBUG"] != nil {
            fputs("DEBUG: Retrying after close/reopen\n", stderr)
        }
        closeActuator()
        if openActuator(), let retryActuator = persistentActuator {
            actuateResult = MTActuatorActuate(retryActuator, clampedActuationID, 0, 0.0, clampedIntensity)
            if ProcessInfo.processInfo.environment["DEBUG"] != nil {
                fputs("DEBUG: Retry result = \(actuateResult)\n", stderr)
            }
        }
    }
    
    return actuateResult == 0
}

// MARK: - Command Processing

func processCommand(_ input: String) {
    let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    
    let parts = trimmed.split(separator: ",")
    
    var actuationID: Int32 = ACTUATION_STRONG
    var intensity: Float = 2.0  // Maximum intensity by default
    
    if parts.count >= 2 {
        actuationID = Int32(parts[0]) ?? ACTUATION_STRONG
        if let parsedIntensity = Float(parts[1]), parsedIntensity.isFinite {
            intensity = parsedIntensity
        }
    } else if let value = Float(trimmed), value.isFinite {
        intensity = value
    }
    
    let success = triggerHaptic(actuationID: actuationID, intensity: intensity)
    
    if ProcessInfo.processInfo.environment["DEBUG"] != nil {
        let status = success ? "OK" : "FAIL"
        FileHandle.standardError.write("\(status)\n".data(using: .utf8)!)
    }
}

// MARK: - Main

func main() {
    guard findTrackpadDeviceID() != nil else {
        fputs("ERROR: No supported trackpad found\n", stderr)
        exit(1)
    }
    
    while let input = readLine() {
        processCommand(input)
        
        if getppid() == 1 {
            break
        }
    }
}

main()
