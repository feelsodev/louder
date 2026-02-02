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
func MTActuatorActuate(_ actuator: OpaquePointer, _ actuationID: Int32, _ unknown1: UInt32, _ unknown2: Float, _ intensity: Float) -> Int32

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
        
        return UInt64(bitPattern: deviceID)
    }
    
    return nil
}

// MARK: - Haptic Feedback

/// Actuation IDs: 1=very weak, 3=weak, 4=medium, 5=medium-strong, 6=strong, 15=very strong
let ACTUATION_STRONG: Int32 = 15
let ACTUATION_WEAK: Int32 = 6

func triggerHaptic(actuationID: Int32, intensity: Float) -> Bool {
    guard let deviceID = findTrackpadDeviceID() else {
        return false
    }
    
    guard let actuator = MTActuatorCreateFromDeviceID(deviceID) else {
        return false
    }
    
    let openResult = MTActuatorOpen(actuator)
    if openResult != 0 {
        _ = MTActuatorClose(actuator)
        return false
    }
    
    let clampedIntensity = max(0.0, min(2.0, intensity))
    let actuateResult = MTActuatorActuate(actuator, actuationID, 0, 0.0, clampedIntensity)
    _ = MTActuatorClose(actuator)
    
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
