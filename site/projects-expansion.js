export const projectsExpansion = [
  {
    "id": "transfer-window-map",
    "title": "Meet a moving destination.",
    "category": "Spaceflight",
    "time": "60–90 min",
    "level": "Next step",
    "icon": "orbit",
    "hook": "Build a paper departure-window map and find out why arriving at the right radius is only half the job.",
    "question": "What starting angle puts a moving destination at the arrival point when the transfer ends?",
    "materials": [
      "Paper and compass or circular templates",
      "Ruler and protractor",
      "Calculator or spreadsheet",
      "Two paper markers"
    ],
    "lessons": [
      "orbits-are-falling-paths",
      "orbital-transfers",
      "transfer-time-and-phasing",
      "writing-a-decision-memo"
    ],
    "steps": [
      {
        "title": "Define a deliberately small universe",
        "body": "Draw concentric circles with radii 5 cm and 10 cm. They represent coplanar circular orbits with a radius ratio of 2. Set the inner period to an invented 100 minutes. Both vehicles travel counterclockwise. Label the model assumptions beside the drawing."
      },
      {
        "title": "Calculate the two clocks",
        "body": "Use period proportional to radius to the power 3/2. Calculate the outer circular period, 100 × 2^(3/2), and half the period of a transfer ellipse whose semimajor axis is 1.5 inner radii. Keep the units and intermediate values."
      },
      {
        "title": "Mark the arrival before the departure",
        "body": "Place transfer departure on the inner circle at 0°, on the right of the page. The half-ellipse arrival is on the outer circle at 180°. Sketch the transfer arc as a schematic; do not claim that an arbitrary hand curve is the precise ellipse."
      },
      {
        "title": "Place the moving destination",
        "body": "Calculate how far the destination travels during the approximately 91.86-minute coast. Subtract that angle from 180°. Mark the resulting initial lead of approximately 63.1°. Advance the destination by its calculated angle and measure its arrival mismatch."
      },
      {
        "title": "Test the wrong starting position",
        "body": "Start the destination at 20° instead. Keep the transfer time unchanged. Record the approximately 43.1° angular shortfall. The traveler reaching the outer radius has not thereby met the destination."
      },
      {
        "title": "Set an acceptance rule",
        "body": "Require the calculated coast time to agree with the worked lesson within 0.1 minute, and the correctly phased destination marker to land within 2° of the 180° arrival mark using your protractor. Record the measured discrepancy instead of silently adjusting the marker."
      },
      {
        "title": "Explain what the drawing cannot prove",
        "body": "Write a short review note distinguishing position matching from matching velocity. Name omitted inclination, finite burns, and navigation errors. Explain which error would come from arithmetic and which from the physical drawing."
      }
    ],
    "measure": "Radius ratio, two periods, coast duration, initial phase angle, and measured arrival-angle mismatch for both starting positions.",
    "deliverable": "An annotated two-orbit map, calculation table, and a brief explaining why one departure works in the model.",
    "stretch": "Change the outer radius ratio to 1.5 and recompute every dependent quantity. Keep the inner period fixed and predict whether the required lead grows or shrinks before calculating.",
    "connection": "Exponents determine the clocks; geometry makes the meeting visible; technical writing separates a useful transfer model from a complete mission. Keep the failed 20° case as evidence that your method can distinguish success from failure."
  },
  {
    "id": "landing-profile-workbook",
    "title": "Give a descent a stopping margin.",
    "category": "Spaceflight",
    "time": "60–90 min",
    "level": "Next step",
    "icon": "ramp",
    "hook": "Build a spreadsheet lander. Let a changed mass expose the difference between hovering and stopping.",
    "question": "Under a constant-acceleration teaching model, does a selected thrust stop a descent before the surface?",
    "materials": [
      "Spreadsheet or graph paper",
      "Calculator",
      "The landing lesson's selected inputs"
    ],
    "lessons": [
      "acceleration-and-newton",
      "quadratics-and-stopping-distance",
      "landing-with-a-thrust-margin",
      "requirements-that-can-be-tested"
    ],
    "steps": [
      {
        "title": "Declare the model",
        "body": "Use upward-positive motion, initial height 80 m, initial velocity −12 m/s, gravity 1.62 m/s², mass 200 kg, and upward thrust 600 N. Assume constant mass, thrust, and gravity for one vertical braking segment. This is a numerical build study; no physical vehicle or dropping experiment is needed."
      },
      {
        "title": "Derive before filling rows",
        "body": "Calculate net acceleration T/m − g = 1.38 m/s². Write velocity −12 + 1.38t and height 80 − 12t + 0.5 × 1.38t². Show why thrust divided by mass is not the net acceleration."
      },
      {
        "title": "Build the time history",
        "body": "Make columns for time, velocity, and height. Use 0.5-second intervals up to the stopping time, then add the exact stopping-time row, about 8.696 s. Stop this modeled segment when velocity reaches zero; continued upward acceleration would describe a different operation."
      },
      {
        "title": "Check the numerical artifact",
        "body": "Require the exact final row to have |velocity| below 0.001 m/s and height between 27.7 and 27.9 m. Check the initial row exactly reproduces 80 m and −12 m/s. Those checks catch sign and copied-cell errors."
      },
      {
        "title": "Change mass, not the story",
        "body": "Duplicate the sheet with mass 250 kg, keeping thrust and initial motion unchanged. Recompute acceleration, stopping time, and stopping distance. The calculated 92.3 m stopping distance exceeds the available 80 m. Flag surface contact as failure rather than interpreting a negative height as a possible landing."
      },
      {
        "title": "Record model failure modes",
        "body": "List a wrong gravity sign, omitted weight, a time column accidentally in minutes, and a missing mass update. Deliberately introduce one error in a copy and show which check catches it. Preserve the correct sheet separately."
      },
      {
        "title": "Write the decision",
        "body": "Create a one-paragraph comparison: which selected case meets the modeled stopping condition, how much margin remains, and what additional physics would be needed for a real descent analysis."
      }
    ],
    "measure": "Net acceleration, stopping time, stopping distance, minimum modeled height, and residual velocity at the exact stopping row for both masses.",
    "deliverable": "A two-case calculation workbook with a height-time plot, explicit pass/fail cells, and an assumption note.",
    "stretch": "Solve for the constant net acceleration needed to stop within 60 m. Then convert that acceleration into required thrust for each selected mass, keeping the model's limitations visible.",
    "connection": "Algebra turns force into acceleration, quadratics predict the trajectory, and a written acceptance rule prevents a visually smooth graph from disguising a failed requirement."
  },
  {
    "id": "delayed-feedback-board",
    "title": "Control a machine with old information.",
    "category": "Controls",
    "time": "45–75 min",
    "level": "Next step",
    "icon": "network",
    "hook": "A paper slider lets you watch a controller overshoot without a motor, sensor, or circuit.",
    "question": "How does a one-update measurement delay change an otherwise identical position controller?",
    "materials": [
      "Squared paper and a marker token",
      "Calculator or spreadsheet",
      "Two colors",
      "Small cards labeled with step numbers"
    ],
    "lessons": [
      "feedback-and-control",
      "feedback-with-a-delayed-measurement",
      "state-machines-and-interlocks"
    ],
    "steps": [
      {
        "title": "Define the paper machine",
        "body": "Let the token position be x in millimetres on a number line. Choose target r = 10 mm and gain K = 0.8. In this intentionally simplified model, each command instantly adds K times the measured error to position. There is no inertia or actuator limit."
      },
      {
        "title": "Run the fresh-measurement version",
        "body": "Start at x₀ = 0. Calculate xₙ₊₁ = xₙ + 0.8(10 − xₙ). Make ten updates, retaining unrounded values in the calculation. Draw the resulting positions in one color."
      },
      {
        "title": "Add exactly one step of delay",
        "body": "Initialize x₋₁ = x₀ = 0. Now use xₙ₊₁ = xₙ + 0.8(10 − xₙ₋₁). Put each previous observation on a card so the one-update age is visible. Draw these positions in the second color."
      },
      {
        "title": "Verify the procedure",
        "body": "The first three delayed positions should be 8, 16, and 17.6 mm. Require agreement within 0.01 mm numerically. If not, inspect whether you used the current position instead of the previous one. The first fresh positions should be 8, 9.6, and 9.92 mm."
      },
      {
        "title": "Measure the consequence",
        "body": "For each ten-update run, record the maximum position, number of target crossings, and final absolute error. State that these are finite-run observations, not a proof of stability for every gain or delay."
      },
      {
        "title": "Introduce a recordkeeping failure",
        "body": "Repeat one delayed update using an observation two steps old by mistake. Circle that row and calculate the change. Then define a simple state rule: if an observation's timestamp is not the expected one, stop the paper update and record a fault."
      },
      {
        "title": "Communicate the result",
        "body": "Write a caption that explains why identical targets and gains can produce different motion when information arrives late. Include the update equations so another learner can reproduce the comparison."
      }
    ],
    "measure": "Position after each update, observation age, maximum overshoot, target-crossing count, and final absolute error over the fixed ten-update window.",
    "deliverable": "A two-color position plot, complete update table, and a timestamp-check rule.",
    "stretch": "Repeat with K = 0.4 while keeping the delay unchanged. Compare the same ten-update metrics rather than declaring the slower-looking response automatically better.",
    "connection": "Sequences turn feedback into arithmetic; plots reveal dynamics; a precise procedure keeps a timing mistake from masquerading as physical behavior. The machine stays on paper while the reasoning becomes real."
  },
  {
    "id": "signal-filter-bench",
    "title": "Keep the event inside the signal.",
    "category": "Signals",
    "time": "45–75 min",
    "level": "Start here",
    "icon": "measure",
    "hook": "Make a clean-looking trace, then measure how much it postpones the event you care about.",
    "question": "What does a three-sample moving average preserve, suppress, and delay in a known synthetic record?",
    "materials": [
      "Graph paper or spreadsheet",
      "Calculator",
      "Two colors"
    ],
    "lessons": [
      "functions-as-machine-behavior",
      "sampling-and-aliasing",
      "smoothing-a-noisy-signal",
      "writing-a-decision-memo"
    ],
    "steps": [
      {
        "title": "Create a record with known truth",
        "body": "At times 0 through 8 seconds, use values 10, 10, 10, 16, 16, 16, 16, 16, 16 in selected sensor units. This contains a deliberate step at 3 s. Keep the raw sequence intact and label it synthetic."
      },
      {
        "title": "Implement the stated filter",
        "body": "Compute each output from the current sample and the previous two. Leave the first two outputs undefined because a full window is unavailable. Do not use future samples or silently pad the beginning with zeros."
      },
      {
        "title": "Check by hand",
        "body": "At times 2, 3, 4, and 5 s the outputs should be 10, 12, 14, and 16. Require agreement within 0.001 sensor unit in your calculation. Plot the points without hiding the one-second sample spacing."
      },
      {
        "title": "Test an event rule",
        "body": "Declare an event when the value first reaches or exceeds 14. The raw trace triggers at 3 s; the filtered trace triggers at 4 s. Record the one-second detection delay rather than judging the smoother line only by its appearance."
      },
      {
        "title": "Try a different disturbance",
        "body": "Make a separate five-sample record 10, 10, 19, 10, 10. Its three valid moving-average outputs are all 13. The isolated peak becomes a lower but longer feature. Record both changes without assuming the peak was irrelevant noise."
      },
      {
        "title": "Inject a missing sample",
        "body": "Replace one raw value with a blank. Select and document a policy, such as leaving every affected filtered window undefined. Verify the sheet does not silently treat a blank as zero. This is a failure-mode check, not permission to invent a measurement."
      },
      {
        "title": "Report the tradeoff",
        "body": "Write a short recommendation for either trend display or rapid event detection. State which trace you would retain, how the filter is defined, and what its delay does to the chosen purpose."
      }
    ],
    "measure": "Raw and filtered samples, first threshold-crossing time, peak height, number of affected outputs, and treatment of unavailable data.",
    "deliverable": "Two paired plots, a filter definition, a threshold timing table, and a documented missing-data policy.",
    "stretch": "Repeat with a five-sample trailing average. Compare delay and peak spreading while keeping the raw records unchanged.",
    "connection": "Averages become a signal-processing tool when their time window matters. Clear writing prevents a visually polished graph from implying a faster or more certain measurement than the method provides."
  },
  {
    "id": "datum-overlay-gauge",
    "title": "Make two drawings agree on where zero is.",
    "category": "CAD & interfaces",
    "time": "60–90 min",
    "level": "Start here",
    "icon": "measure",
    "hook": "Build a cardboard coordinate gauge and expose the difference between a shifted origin and a changed hole spacing.",
    "question": "Can independently marked patterns agree when they use explicit reference edges and a repeatable inspection method?",
    "materials": [
      "Paper or thin cardboard",
      "Ruler and pencil",
      "Transparent tracing paper if available",
      "Tape",
      "Optional drawing or CAD software"
    ],
    "lessons": [
      "engineering-drawings",
      "datums-and-hole-patterns",
      "tolerance-stack",
      "teamwork-at-the-interface"
    ],
    "steps": [
      {
        "title": "Define a visible reference system",
        "body": "Draw a 100 by 70 mm rectangle. Identify its left edge as x = 0 and its bottom edge as y = 0. Mark two crosshair centers at (20, 30) and (50, 30) mm. No drilling is needed; the crosshairs stand in for hole centers."
      },
      {
        "title": "Choose a realistic paper criterion",
        "body": "Use a teaching acceptance band of ±1 mm for each center coordinate, measured from the stated edges. This hand-marking criterion is deliberately separate from the tighter numerical tolerances in the lesson."
      },
      {
        "title": "Make an independent copy",
        "body": "Cover the first pattern and create a second from the written dimensions. If working with another person, share only the drawing definition. If working alone, begin a new sheet without tracing."
      },
      {
        "title": "Inspect from the references",
        "body": "Align the reference edges, then compare corresponding crosshairs. Record x and y errors for each. Require each of the four coordinate errors to be within ±1 mm for the selected paper acceptance rule. Keep failing values visible."
      },
      {
        "title": "Create an origin mistake",
        "body": "Shift both marks on a third pattern 3 mm right while preserving their 30 mm separation. Measure spacing and coordinates. This pattern passes the spacing check but fails the reference-coordinate check, revealing why one dimension does not establish the whole interface."
      },
      {
        "title": "Predict the worst spacing",
        "body": "For the ±1 mm x-coordinate bands, calculate the smallest and largest possible spacing: 29 − 21 = 28 mm and 31 − 19 = 32 mm. Explain why two passing individual coordinates can still allow a ±2 mm spacing variation."
      },
      {
        "title": "Revise the communication",
        "body": "Add units, reference-edge labels, center symbols, revision, and the inspection rule to the drawing. Write one sentence about what the paper exercise does not establish, such as actual hole size or perpendicularity."
      }
    ],
    "measure": "Four center-coordinate deviations per copy, center spacing, reference-edge alignment, and explicit pass/fail against the selected ±1 mm rule.",
    "deliverable": "A reference drawing, two independently marked patterns, the intentionally shifted pattern, and an inspection table.",
    "stretch": "Recreate the drawing in any available CAD tool and export it. Verify the exported scale with the 100 mm reference dimension before trusting printed measurements.",
    "connection": "Coordinates create an interface contract; tolerances describe permitted variation; a drawing communicates both. A spacing-only check can miss an entire pattern shifted into the wrong place."
  },
  {
    "id": "current-navigation-map",
    "title": "Find the route the water makes.",
    "category": "Ocean autonomy",
    "time": "45–75 min",
    "level": "Next step",
    "icon": "route",
    "hook": "Draw an underwater vehicle's track, then watch a small current error widen into a missed destination.",
    "question": "How do heading, current, and elapsed time determine a predicted ground track and its error?",
    "materials": [
      "Graph paper",
      "Ruler",
      "Calculator",
      "Two colors",
      "Optional spreadsheet"
    ],
    "lessons": [
      "vectors-for-a-moving-tool",
      "dead-reckoning-in-a-current",
      "sonar-time-and-range",
      "requirements-that-can-be-tested"
    ],
    "steps": [
      {
        "title": "Set the map and clock",
        "body": "Use a local east/north map with one centimetre representing 100 m. Select a through-water velocity of (1.2, 0) m/s and a current of (0, 0.3) m/s. Assume both are constant for 600 s and start at the map origin."
      },
      {
        "title": "Propagate by intervals",
        "body": "Add the two velocity vectors. Plot a predicted point every 100 s. Each step should add 120 m east and 30 m north. Label elapsed time at each point rather than drawing an unlabeled diagonal."
      },
      {
        "title": "Verify the endpoint",
        "body": "The computed endpoint should be (720, 180) m. Require numerical agreement within 0.1 m and drawing agreement within 1 mm at the selected map scale. The paper tolerance corresponds to 10 m, so distinguish drawing precision from calculation precision."
      },
      {
        "title": "Separate heading from track",
        "body": "Draw the vehicle's eastward heading arrow beside its northeast ground-track arrow. Calculate the track angle, about 14.0° north of east. State why a correct heading alone cannot verify the desired ground path."
      },
      {
        "title": "Inject an environmental error",
        "body": "Use 0.35 m/s as the actual northward current while the planner still assumes 0.30. Plot the second endpoint, (720, 210) m. Record the 30 m error and its growth at each 100-second step."
      },
      {
        "title": "Design a correction opportunity",
        "body": "Add an idealized independent position fix at 300 s and reset the predicted position to it. Keep the same erroneous current estimate afterward. Calculate the final error of 15 m; the fix resets accumulated error but does not repair the current model."
      },
      {
        "title": "Write a navigation note",
        "body": "Report assumptions, map scale, endpoint errors, and the difference between an observation and a propagated estimate. Name one missing real-world effect, such as varying current or heading uncertainty."
      }
    ],
    "measure": "Ground-velocity components, position at each 100-second interval, track angle, and endpoint error with and without the selected position correction.",
    "deliverable": "A two-track navigation map, propagation table, and a short explanation of what the correction does and does not fix.",
    "stretch": "Choose a through-water heading that cancels the 0.3 m/s north current while keeping speed 1.2 m/s. Calculate the reduced eastward progress and draw the new track.",
    "connection": "Vector addition becomes navigation, while multiplying an error by time reveals why autonomy needs both a model and observations. A scale drawing makes accumulated uncertainty tangible."
  },
  {
    "id": "fault-recognition-review",
    "title": "Build a detector's evidence table.",
    "category": "Engineering statistics",
    "time": "45–75 min",
    "level": "Start here",
    "icon": "network",
    "hook": "An alert can be mostly false even when a detector catches most faults. Build the table before trusting the percentage.",
    "question": "How do the event rate and false-alarm rate change the meaning of a positive result?",
    "materials": [
      "Paper or spreadsheet",
      "Calculator",
      "Two colors"
    ],
    "lessons": [
      "statistics-behind-the-average",
      "false-alarms-and-base-rates",
      "reliability-through-two-paths",
      "ethics-when-the-test-disagrees"
    ],
    "steps": [
      {
        "title": "Create a fully synthetic population",
        "body": "Use 10,000 fictional inspection cases: 100 contain the defined fault and 9,900 do not. Select a detector that catches 90% of faults and falsely alerts on 5% of healthy cases. These are model inputs, not product performance claims."
      },
      {
        "title": "Fill all four outcomes",
        "body": "Make rows for actual fault and no fault, and columns for alert and no alert. Calculate 90 true alerts, 10 missed faults, 495 false alerts, and 9,405 correct negatives."
      },
      {
        "title": "Check conservation of cases",
        "body": "Require the four cells to sum to 10,000; the fault row to sum to 100; and the healthy row to sum to 9,900. A failed total signals an arithmetic or denominator mistake before any interpretation."
      },
      {
        "title": "Calculate the useful conditional fraction",
        "body": "Of the 585 alerts, only 90 contain faults. Compute approximately 15.4%. Write 'fraction of alerts that contain faults' in full so it cannot be confused with the 90% fault-detection rate."
      },
      {
        "title": "Improve one rate",
        "body": "Keep the same population and detection rate but reduce false alerts to 1% of healthy cases. Recalculate the full table: 99 false alerts and 189 alerts overall. The fault fraction among alerts becomes approximately 47.6%."
      },
      {
        "title": "Introduce a different population",
        "body": "Return to the 5% false-alarm rate but use 1,000 faults and 9,000 healthy cases. Calculate 900 true alerts and 450 false alerts. Explain why the alerted fault fraction becomes about 66.7% without changing the detector's conditional rates."
      },
      {
        "title": "Recommend a response policy",
        "body": "Write a short review distinguishing initial alert, follow-up inspection, and confirmed finding. Describe the consequences of a missed fault and unnecessary intervention without pretending that the table alone decides their relative importance."
      }
    ],
    "measure": "All four outcome counts, row and column totals, missed faults, and the fraction of alerts containing faults in three selected scenarios.",
    "deliverable": "Three checked contingency tables and a one-page response-policy recommendation.",
    "stretch": "Assign explicitly hypothetical costs to a missed fault and a follow-up inspection. Compare policies, then vary those cost assumptions to see whether the recommendation changes.",
    "connection": "Ratios and conditional probability determine what an alert means. Ethics and communication determine whether the resulting uncertainty is represented honestly to the person who must act."
  },
  {
    "id": "acceptance-review-kit",
    "title": "Make a small design earn its pass.",
    "category": "Systems & judgment",
    "time": "60–90 min",
    "level": "Start here",
    "icon": "memo",
    "hook": "Turn a paper tray into a reviewed system with requirements, failure evidence, and a decision someone else can inspect.",
    "question": "Can a simple prototype meet explicit requirements without hiding a failed trial behind a good average?",
    "materials": [
      "Paper or cardboard",
      "Tape",
      "A small lightweight block or empty box",
      "Ruler",
      "Timer",
      "Paper or spreadsheet"
    ],
    "lessons": [
      "requirements-that-can-be-tested",
      "constraints-before-scores",
      "test-design-and-confounding",
      "writing-a-decision-memo",
      "data-minimization-by-design"
    ],
    "steps": [
      {
        "title": "Write the job before the object",
        "body": "Design a tabletop tray from which one lightweight block can be removed. Choose and record the block's dimensions. Keep all handling on a stable desk; the study concerns access and evidence rather than structural capacity."
      },
      {
        "title": "Specify three observable requirements",
        "body": "For this exercise, require at least 2 mm total side clearance, removal within 15 s in each of five trials, and no need to detach the tray from the desk. Define where clearance is measured and exactly when timing starts and stops."
      },
      {
        "title": "Build and inspect",
        "body": "Make the tray, measure its minimum opening and the block width, and calculate their difference. Record ruler resolution. If the result is too close to the threshold to distinguish confidently, mark the evidence unresolved and revise or improve the measurement."
      },
      {
        "title": "Run the same procedure five times",
        "body": "Reset the tray and block between trials. Keep individual times and record any detachment, jam, or incomplete attempt. Do not drop an awkward trial because the other four looked better."
      },
      {
        "title": "Judge each requirement separately",
        "body": "Require clearance evidence supporting at least 2 mm, all five times at or below 15 s, and zero detachments. Calculate the average for context, but do not let it override an individual-trial requirement."
      },
      {
        "title": "Inject a visible failure",
        "body": "Temporarily add a paper shim that reduces the opening. Predict which requirement it could violate, then inspect or test it. Remove the shim afterward. This checks whether your review method can actually recognize a changed condition."
      },
      {
        "title": "Revise and keep both records",
        "body": "Change one feature to address the observed weakness. Repeat the same inspection and five-trial procedure. Preserve the original data and describe exactly which feature changed, rather than presenting only the better version."
      },
      {
        "title": "Prepare a minimal review packet",
        "body": "Include a dimensioned sketch, requirement-to-evidence table, raw trial results, and a brief decision. Label trials by number; personal names or identities are unnecessary for this teaching purpose. State one operating condition that remains untested."
      }
    ],
    "measure": "Opening and block widths, total clearance, individual removal times, detachments, jams, and pass/fail or unresolved status for every requirement.",
    "deliverable": "A prototype plus a compact review packet containing the original and revised evidence, a deliberately detected failure, and a recommendation.",
    "stretch": "Have another person follow only the written procedure, or revisit it yourself after a break. Record ambiguities and revise the method before comparing new results.",
    "connection": "Measurement supplies the evidence, systems thinking defines the claim, and writing makes the decision reviewable. Collecting only the information needed for the task also makes the report easier to share."
  }
];

