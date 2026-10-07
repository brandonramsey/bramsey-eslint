# Validate at 0.1.0 before promising a stable policy

Publish the first release at `0.1.0` and validate it in the user's projects before releasing `1.0.0`. Freeze upstream rule choices and review dependency upgrades so moving upstream presets do not silently redefine this package's policy.

After `1.0.0`, newly enforced rules, stricter defaults, and increased runtime requirements require major releases. Optional features may be minor releases, and nonbreaking fixes may be patch releases. This favors predictable upgrades over automatically absorbing new upstream strictness.
