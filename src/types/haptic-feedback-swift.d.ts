declare module "haptic-feedback-swift" {
  type HapticPattern = "levelChange" | "generic" | "alignment"
  
  export class HapticFeedback {
    constructor()
    trigger(pattern?: HapticPattern): void
  }
}
