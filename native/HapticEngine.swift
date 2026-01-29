import Foundation
import IOKit

// MARK: - MultitouchSupport Framework FFI

typealias MTActuatorCreateFromDeviceID = @convention(c) (UInt64) -> OpaquePointer?
typealias MTActuatorOpen = @convention(c) (OpaquePointer) -> Int32
typealias MTActuatorClose = @convention(c) (OpaquePointer) -> Int32
typealias MTActuatorActuate = @convention(c) (OpaquePointer, Int32, UInt32, Float, Float) -> Int32

var mtActuatorCreateFromDeviceID: MTActuatorCreateFromDeviceID?
var mtActuatorOpen: MTActuatorOpen?
var mtActuatorClose: MTActuatorClose?
var mtActuatorActuate: MTActuatorActuate?

func loadMultitouchFramework() -> Bool {
    let frameworkPath = "/System/Library/PrivateFrameworks/MultitouchSupport.framework/MultitouchSupport"
    
    guard let handle = dlopen(frameworkPath, RTLD_NOW) else {
        return false
    }
    
    guard let createPtr = dlsym(handle, "MTActuatorCreateFromDeviceID"),
          let openPtr = dlsym(handle, "MTActuatorOpen"),
          let closePtr = dlsym(handle, "MTActuatorClose"),
          let actuatePtr = dlsym(handle, "MTActuatorActuate") else {
        dlclose(handle)
        return false
    }
    
    mtActuatorCreateFromDeviceID = unsafeBitCast(createPtr, to: MTActuatorCreateFromDeviceID.self)
    mtActuatorOpen = unsafeBitCast(openPtr, to: MTActuatorOpen.self)
    mtActuatorClose = unsafeBitCast(closePtr, to: MTActuatorClose.self)
    mtActuatorActuate = unsafeBitCast(actuatePtr, to: MTActuatorActuate.self)
    
    return true
}

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

var cachedDeviceID: UInt64?
var cachedActuator: OpaquePointer?

func invalidateCache() {
    cachedDeviceID = nil
    cachedActuator = nil
}

/// Actuation IDs: 1=very weak, 3=weak, 4=medium, 5=medium-strong, 6=strong, 15=very strong
let ACTUATION_STRONG: Int32 = 6
let ACTUATION_WEAK: Int32 = 3

func triggerHaptic(actuationID: Int32, intensity: Float) -> Bool {
    guard let createFunc = mtActuatorCreateFromDeviceID,
          let openFunc = mtActuatorOpen,
          let closeFunc = mtActuatorClose,
          let actuateFunc = mtActuatorActuate else {
        return false
    }
    
    if cachedDeviceID == nil {
        cachedDeviceID = findTrackpadDeviceID()
    }
    
    guard let deviceID = cachedDeviceID else {
        return false
    }
    
    if cachedActuator == nil {
        cachedActuator = createFunc(deviceID)
    }
    
    guard let actuator = cachedActuator else {
        invalidateCache()
        return false
    }
    
    let openResult = openFunc(actuator)
    if openResult != 0 {
        invalidateCache()
        return false
    }
    
    let clampedIntensity = max(0.0, min(2.0, intensity))
    let actuateResult = actuateFunc(actuator, actuationID, 0, 0.0, clampedIntensity)
    _ = closeFunc(actuator)
    
    if actuateResult != 0 {
        invalidateCache()
        return false
    }
    
    return true
}

// MARK: - Command Processing

func processCommand(_ input: String) {
    let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    
    let parts = trimmed.split(separator: ",")
    
    var actuationID: Int32 = ACTUATION_STRONG
    var intensity: Float = 1.0
    
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
    guard loadMultitouchFramework() else {
        fputs("ERROR: Failed to load MultitouchSupport.framework\n", stderr)
        exit(1)
    }
    
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
