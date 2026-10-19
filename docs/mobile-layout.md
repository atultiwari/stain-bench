# Phone layout for the three H&E pages ("option B: follow the rack")

Applies to phones in portrait: `@media (max-width: 560px)`. Laptop layout (≥ 1100 px) is unchanged.
A phone turned sideways (`(orientation: landscape) and (max-height: 500px)`) uses the laptop side-by-side layout.

The staining steps matter most; the microscope matters least. Never show all 17 jars small and expect them to be read:
follow the rack up close and give the overview as a rail of numbered chips.

## Order, top to bottom

1. **Heading**: one line, about 15 px. Hide the long hint text.
2. **Step strip**: the 7 steps in one horizontal row that scrolls sideways, **sticky at the top** (paper background so
   nothing shows through). The active step is **auto-centred** with `scrollIntoView({inline: 'center', block: 'nearest'})`
   (smooth, or instant under `prefers-reduced-motion`). Done steps faded, next step highlighted. Touch targets ≥ 40 px tall.
3. **Step count and lab time**: one compact row.
4. **Bench, close up ("follow cam")**: about 44% of the viewport height. The view frames the jar the rack is over plus
   one neighbour on each side, so the jar labels are big. It **glides with the rack** while it moves (follow the rack's
   live position, eased, not a jump per station). A **Bench** toggle in the player zooms out to the whole bench and back.
5. **Microscope inset**: a ~56 px circle in the top-right corner of the bench view, no label pills. Tap to enlarge it
   (~70% of the bench width, still inside the bench box); tap again to shrink. The big microscope panel is not shown on phones.
6. **Station rail**: 17 small numbered chips (1–17), coloured by their liquid, in one horizontal row that scrolls; the
   active station is lit and **auto-centred**. Tapping a chip acts like tapping that jar.
7. **Active jar card**: number badge + full name (e.g. "6 · Harris haematoxylin") + time in this bath
   ("4:12 of 5:00", lab time from he-protocol.md; trays and mounting show no time). On phones this sits below the rail,
   not over the bench.
8. **What is happening**: clamped to two lines with a "More" / "Less" toggle.
9. **Player bar, sticky at the bottom**: Play, Pause, Stop and Bench, thumb-sized. Hide Loop and Labels on phones.
10. **Footer**: the credit line, then a plain **"atultiwari.com" text link instead of the QR code** (no one can scan the
    screen they're holding). Keep the QR on laptops.

## Must hold

- No horizontal page scroll at 360, 375 and 390 px; no console errors.
- Every jar label readable at 375 px in the close-up view (≥ 11 px on screen).
- Play runs all 7 steps forward-only and the strip, rail, close-up and card all follow along.
- Verify with phone-emulated screenshots (mobile: true, 375×812): at the start, mid-haematoxylin, mid-eosin, during
  coverslipping, the inset enlarged, and Bench zoomed out; plus 812×375 landscape.
