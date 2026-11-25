---
title: Your first project
description: Walk through a formulation R&D task from setup to recording a follow-up test.
---

This example uses synthetic formulation R&D data and demonstrates the workflow. For day-one setup, see [Quickstart](/docs/quickstart/).

## Prepare the materials

Connect a project folder and put these four files in it. The example uses a newer desktop build. See the [download page](/download/) for the current version.

| File | Purpose |
|---|---|
| Goal.md | Targets for viscosity (95–105 KU), contrast ratio (at least 0.93), and scrub resistance (at least 5,000 cycles) |
| Formula ratios.csv | Sample proportions for formulation F-03 |
| Material specifications.md | Specifications for each material |
| Experiment records / Batch records.csv | Viscosity and contrast ratio for batch B-1024 |

Find the originals under Files and add any documents you want to cite to the library. Edits to a library entry create a new version.

## Choose a domain

Install the formulation R&D starter pack or have AI draft an ontology and approve its entries. This establishes the relationships between formulations, experiment batches, and measurement records.

## Ask a question

Ask in the project which follow-up test should happen first in the next round.

The answer matches the formulation to its batch and checks each measurement against the target:

- Viscosity reached 103 KU.
- Contrast ratio reached 0.95.
- Scrub resistance still needs a measurement.

Each item cites Goal.md or Batch records.csv. Open the citations to see the passages and versions used. Missing measurements stay marked for follow-up.

## Delegate the follow-up

Assign the preparation work to the formulation experiment recorder. The agent prepares the comparison and list of outstanding tests, with decisions that need your review at the top. In a newer desktop build, you can also assign the task from the personal assistant and select this project.

## Confirm and record the result

The researcher confirms the follow-up test. When it is complete, record the result of 5,100 scrub cycles in batch B-1024 and save the test report. The update waits for your confirmation. You can then find the update and conversation notes in the project history.

![The formulation project history shows conversation notes and a link to the original conversation](/screens/desktop-project-history.webp)

Screenshot from the desktop release candidate, captured on November 22, 2026, using the formulation R&D demo project.

## Start the next round

The project keeps the three targets, the B-1024 measurements, and the report so you can reuse them for the next experiment.

See [how it works](/how/#examples) for examples from six other fields.
