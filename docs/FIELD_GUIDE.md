# Field guide (printable)

**Decision order:** friendly check → radio signal → behaviour and camera → weapon in reach?

1. **Friendly check: "Matches flight plan"** → ours. Identify Friendly UAV, **Hold**. Never fire.
2. **RF: control link (2.4 GHz)** → recon drone → **RF jam**.
3. **RF: video link (5.8 GHz)** → FPV attack drone → **RF jam now**.
4. **RF: no emission, slow, erratic** → bird → **Hold**.
5. **RF: no emission, fast, straight in, wing** → loitering munition → **GNSS spoof** (or interceptor). Jamming fails.
6. **RF: no emission, several moving together** → swarm → **GNSS spoof** (hits neighbours too).
7. **Weapon greyed out?** Not in reach yet. Watch its bar; handle the most urgent contact first.

| Contact | Speed | Height | Echo | Radio | Behaviour | Camera | Do this |
|---|---|---|---|---|---|---|---|
| Friendly UAV | ~58 km/h | 150–300 m | Medium | Own-force link | Circles a set route | Fixed wing | Hold |
| Bird / clutter | ~29 km/h | 20–180 m | Very small | None | Erratic | Flapping wings | Hold |
| Recon quad | ~43 km/h | 60–150 m | Small | 2.4 GHz control | Slow approach, then hovers | 4 rotors | RF jam |
| FPV attack | ~115 km/h | 15–60 m | Very small | 5.8 GHz video | Fast, low, weaving | 4 rotors | RF jam |
| Loitering munition | ~151 km/h | 250–500 m | Medium | None | Fast, straight at the asset | Fixed wing | GNSS spoof |
| Swarm drone | ~72 km/h | 60–120 m | Very small | None | Moves with others | 4 rotors | GNSS spoof |

**Look-alikes:** friendly UAV vs loitering munition (both wings: friendly check and behaviour decide) · bird vs swarm vs FPV (all tiny: speed, radio and grouping decide) · recon vs FPV (both rotors and radio: speed and frequency decide).

**Confidence:** Certain only when friendly check, radio and behaviour all agree; if a sensor is down, say Confident.

Values are training values set by your unit (`config/`), not equipment specifications. Speeds vary by about ±12%.
